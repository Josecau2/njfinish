/**
 * Backfill normalized order numbers and snapshot.info.orderNumber for legacy orders.
 *
 * Usage examples (dry-run by default):
 *   node backfill-orders.js                       # Dry-run: show what would change
 *   node backfill-orders.js --no-dry-run          # Apply changes
 *   node backfill-orders.js --since 2024-01-01    # Limit to orders created/accepted since date
 *   node backfill-orders.js --ids 12,18,25        # Only process specific order IDs
 *   node backfill-orders.js --max 100             # Cap number of processed orders
 *   node backfill-orders.js --date-source created # Use createdAt instead of accepted_at for numbering date
 *   node backfill-orders.js --reconcile false     # Do not change snapshot if numbers already exist
 *   node backfill-orders.js --include-proposals   # Also backfill missing proposal numbers
 */
/* eslint-disable no-console */
'use strict';

const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const { Op } = require('sequelize');

const argv = yargs(hideBin(process.argv))
	.option('dry-run', { type: 'boolean', default: true, describe: 'Simulate without writing changes' })
	.option('max', { type: 'number', default: 500, describe: 'Maximum number of orders to process' })
	.option('since', { type: 'string', describe: 'ISO date (YYYY-MM-DD) to filter orders by date source' })
	.option('ids', { type: 'string', describe: 'Comma-separated list of order IDs to process' })
	.option('date-source', { type: 'string', choices: ['accepted', 'created', 'today'], default: 'accepted', describe: 'Which date to use for numbering date bucket' })
	.option('reconcile', { type: 'boolean', default: true, describe: 'Align snapshot.info.orderNumber to model order_number when present' })
	.option('include-proposals', { type: 'boolean', default: false, describe: 'Also backfill missing proposal numbers' })
	.parse();

async function main() {
	// Lazy require after env loads
	const sequelize = require('./config/db');
	const { Order, Proposals } = require('./models');
				const { formatNumber, parseDateLike } = require('./utils/numbering');

	// Helpers
	const isNormalized = (str) => typeof str === 'string' && /^([A-Z]+)-(\d{3})-(\d{6})$/.test(str);
	const parseNormalized = (str) => {
		if (!isNormalized(str)) return null;
		const m = /^([A-Z]+)-(\d{3})-(\d{2})(\d{2})(\d{2})$/.exec(str);
		if (!m) return null;
		const seq = Number(m[2]);
		const mm = Number(m[3]);
		const dd = Number(m[4]);
		const yy = Number(m[5]);
		const fullYear = 2000 + yy; // assumes 20xx
		const dateOnly = `${fullYear}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}`;
		return { seq, dateOnly };
	};

	const dateFromSource = (order) => {
		const src = (argv['date-source'] || 'accepted');
		if (src === 'today') return new Date();
		if (src === 'accepted') return order.accepted_at || order.createdAt || new Date();
		// created
		return order.createdAt || order.accepted_at || new Date();
	};

	const summarize = {
		examined: 0,
		updatedModelNumber: 0,
		patchedSnapshotOnly: 0,
		reconciledMismatch: 0,
		skippedAlreadyGood: 0,
		errors: 0
	};

		try {
		// Build where clause
		const where = {};
		const ids = (argv.ids || '').split(',').map((s) => s.trim()).filter(Boolean).map(Number).filter((n) => !Number.isNaN(n));
		if (ids.length) {
			where.id = { [Op.in]: ids };
		} else if (argv.since) {
			// Since filter based on chosen date column
			const col = argv['date-source'] === 'created' ? 'createdAt' : 'accepted_at';
			where[col] = { [Op.gte]: new Date(argv.since) };
		}

			// Fetch candidate orders; we'll filter in-memory for exact conditions
			const orders = await Order.findAll({
			where,
			order: [['createdAt', 'ASC'], ['id', 'ASC']],
			limit: argv.max > 0 ? argv.max : undefined
		});

		console.log(`\n🔎 Examining up to ${orders.length} order(s)${argv['dry-run'] ? ' [dry-run]' : ''} ...`);

			// Compute per-order date buckets and collect distinct dates to query existing max seq
			const ordersWithDates = orders.map(o => {
				const onDate = dateFromSource(o);
				const d = parseDateLike(onDate);
				const dateOnly = d.toISOString().slice(0, 10);
				return { o, onDate, dateOnly };
			});
			const dateSet = Array.from(new Set(ordersWithDates.map(x => x.dateOnly)));

			// Query current max seq per date in DB
			const maxByDate = {};
			if (dateSet.length) {
				const placeholders = dateSet.map((_, i) => `:d${i}`).join(',');
				const repl = {};
				dateSet.forEach((d, i) => { repl[`d${i}`] = d; });
				const [rows] = await sequelize.query(
					`SELECT order_number_date AS d, MAX(order_number_seq) AS maxSeq
					 FROM orders
					 WHERE order_number_date IN (${placeholders})
					 GROUP BY order_number_date`,
					{ replacements: repl }
				);
				for (const r of rows) {
					if (r.d) maxByDate[r.d] = Number(r.maxSeq || 0);
				}
			}
			// Initialize counters
			const counter = {};
			for (const d of dateSet) counter[d] = Number(maxByDate[d] || 0);

		for (const order of orders) {
			summarize.examined += 1;
			let snapshot;
			try {
				snapshot = typeof order.snapshot === 'string' ? JSON.parse(order.snapshot) : (order.snapshot || {});
			} catch (_) {
				snapshot = {};
			}
			const info = snapshot.info || {};
			const snapNum = info.orderNumber || null;
			const modelNum = order.order_number || null;

					const modelHas = isNormalized(modelNum);
					const snapHas = isNormalized(snapNum);

					// Decide target number and components using per-date counters
					let targetNumber = null;
					let targetDateOnly = null;
					let targetSeq = null;
					const onDate = dateFromSource(order);
					const dateOnly = (onDate instanceof Date ? onDate : new Date(onDate)).toISOString().slice(0, 10);

					if (modelHas) {
						targetNumber = modelNum;
						const parsed = parseNormalized(modelNum);
						if (parsed) { targetDateOnly = parsed.dateOnly; targetSeq = parsed.seq; }
						// Keep counter in sync to avoid allocating duplicates later
						if (parsed && parsed.dateOnly === dateOnly) {
							counter[dateOnly] = Math.max(counter[dateOnly] || 0, parsed.seq);
						}
					} else if (snapHas) {
						targetNumber = snapNum;
						const parsed = parseNormalized(snapNum);
						if (parsed) { targetDateOnly = parsed.dateOnly; targetSeq = parsed.seq; }
						if (parsed && parsed.dateOnly === dateOnly) {
							counter[dateOnly] = Math.max(counter[dateOnly] || 0, parsed.seq);
						}
					} else {
						const nextSeq = (counter[dateOnly] || 0) + 1;
						targetSeq = nextSeq;
						targetDateOnly = dateOnly;
								targetNumber = formatNumber('NJ', nextSeq, dateOnly);
						counter[dateOnly] = nextSeq;
					}

			// Determine what to update
			const needsModelNumber = !modelHas || !order.order_number_date || !order.order_number_seq;
			const needsSnapshotNumber = argv.reconcile && (!snapHas || snapNum !== targetNumber);

			if (!needsModelNumber && !needsSnapshotNumber) {
				summarize.skippedAlreadyGood += 1;
				continue;
			}

			const before = { id: order.id, modelNum, snapNum };
			const after = { id: order.id, modelNum: needsModelNumber ? targetNumber : modelNum, snapNum: needsSnapshotNumber ? targetNumber : snapNum };

			if (argv['dry-run']) {
				if (needsModelNumber) console.log(`• [MODEL] Order ${order.id}: ${modelNum || '(none)'} -> ${targetNumber} (date=${targetDateOnly}, seq=${targetSeq})`);
				if (needsSnapshotNumber) console.log(`  [SNAP ] Order ${order.id}: ${snapNum || '(none)'} -> ${targetNumber}`);
				if (needsModelNumber) summarize.updatedModelNumber += 1; else if (needsSnapshotNumber) summarize.patchedSnapshotOnly += 1;
				continue;
			}

			// Apply updates
			let attempts = 0;
			const maxAttempts = 5;
							while (true) {
				try {
					const updates = {};
					if (needsModelNumber) {
						updates.order_number = targetNumber;
						updates.order_number_date = targetDateOnly;
						updates.order_number_seq = targetSeq;
					}
					if (needsSnapshotNumber) {
						const newSnap = { ...(snapshot || {}) };
						newSnap.info = { ...(snapshot?.info || {}), orderNumber: targetNumber };
						updates.snapshot = newSnap;
					}

					await Order.update(updates, { where: { id: order.id } });

					if (needsModelNumber) summarize.updatedModelNumber += 1;
					else if (needsSnapshotNumber) summarize.patchedSnapshotOnly += 1;

					// Done for this order
					break;
								} catch (e) {
									const msg = e?.message || String(e);
							const isUnique = (
								e?.name === 'SequelizeUniqueConstraintError' ||
								e?.errors?.some?.((er) => (er?.type || '').toLowerCase().includes('unique')) ||
								/duplicate entry/i.test(msg) ||
								/unique/i.test(msg) ||
								(e?.parent && (e.parent.code === 'ER_DUP_ENTRY' || e.parent.errno === 1062))
							);
					attempts += 1;
										if (isUnique && attempts < maxAttempts) {
											// Allocate next in-memory sequence for this date and retry
											const d = targetDateOnly || dateOnly;
											const bump = (counter[d] || 0) + 1;
											counter[d] = bump;
											targetSeq = bump;
											targetDateOnly = d;
											targetNumber = formatNumber('NJ', bump, d);
											continue;
										}
								// Try raw SQL fallback for plain validation errors (e.g., JSON validations)
								const isValidation = e?.name === 'SequelizeValidationError' || /validation error/i.test(msg);
								if (isValidation) {
									try {
										const sets = [];
										const repl = { id: order.id };
										if (needsModelNumber) {
											sets.push('order_number = :order_number');
											sets.push('order_number_date = :order_number_date');
											sets.push('order_number_seq = :order_number_seq');
											repl.order_number = targetNumber;
											repl.order_number_date = targetDateOnly;
											repl.order_number_seq = targetSeq;
										}
										if (needsSnapshotNumber) {
											// Persist snapshot via raw SQL as JSON string
											const newSnap = { ...(snapshot || {}) };
											newSnap.info = { ...(snapshot?.info || {}), orderNumber: targetNumber };
											sets.push('snapshot = :snapshot');
											repl.snapshot = JSON.stringify(newSnap);
										}
										if (sets.length) {
											await sequelize.query(
												`UPDATE orders SET ${sets.join(', ')} WHERE id = :id`,
												{ replacements: repl }
											);
											if (needsModelNumber) summarize.updatedModelNumber += 1; else if (needsSnapshotNumber) summarize.patchedSnapshotOnly += 1;
											break; // success via raw path
										}
									} catch (rawErr) {
										console.error(`❌ Raw fallback failed for order ${order.id}:`, rawErr?.message || rawErr);
									}
								}
								console.error(`❌ Failed updating order ${order.id}:`, { msg, name: e?.name, errors: e?.errors, parent: e?.parent?.message || null });
								summarize.errors += 1;
								break;
				}
			}
		}

		// Optionally backfill proposals
			if (argv['include-proposals']) {
			const whereP = {};
			if (argv.since) whereP.createdAt = { [Op.gte]: new Date(argv.since) };
				const proposals = await Proposals.findAll({ where: whereP, order: [['createdAt', 'ASC'], ['id', 'ASC']], limit: argv.max > 0 ? argv.max : undefined });
			let pExamined = 0, pUpdated = 0, pSkipped = 0, pErrors = 0;
			console.log(`\n🔎 Examining up to ${proposals.length} proposal(s) for missing numbers${argv['dry-run'] ? ' [dry-run]' : ''} ...`);
			for (const p of proposals) {
				pExamined += 1;
					let num = p.proposal_number || null;
					const hasNum = isNormalized(num);
					// Case A: already normalized and starts with NJQ — good
					if (hasNum && /^NJQ-/.test(num)) { pSkipped += 1; continue; }

					// Case B: already normalized but starts with NJ — rename to NJQ keeping date/seq
					if (hasNum && /^NJ-/.test(num)) {
						const parsed = parseNormalized(num);
						if (!parsed) { pSkipped += 1; continue; }
						const newNum = formatNumber('NJQ', parsed.seq, parsed.dateOnly);
						if (argv['dry-run']) {
							console.log(`• [PROPOSAL] ${p.id}: ${num} -> ${newNum} (rename keep date/seq)`);
							pUpdated += 1; continue;
						}
						try {
							await Proposals.update({ proposal_number: newNum }, { where: { id: p.id } });
							pUpdated += 1;
						} catch (e) {
							console.error(`❌ Failed renaming proposal ${p.id}:`, e?.message || e);
							pErrors += 1;
						}
						continue;
					}

					// Case C: missing or non-normalized — generate new NJQ number
					const d = parseDateLike(p.createdAt || new Date());
					const dateOnly = d.toISOString().slice(0, 10);
					// Compute next seq for this date across proposals
					const [[rowP]] = await sequelize.query(
						`SELECT MAX(proposal_number_seq) AS maxSeq FROM proposals WHERE proposal_number_date = :dateOnly`,
						{ replacements: { dateOnly } }
					);
					const nextSeq = Number(rowP?.maxSeq || 0) + 1;
					const newNum = formatNumber('NJQ', nextSeq, dateOnly);
					if (argv['dry-run']) {
						console.log(`• [PROPOSAL] ${p.id}: ${num || '(none)'} -> ${newNum} (date=${dateOnly}, seq=${nextSeq})`);
						pUpdated += 1; continue;
					}
					try {
						await Proposals.update({
							proposal_number: newNum,
							proposal_number_date: dateOnly,
							proposal_number_seq: nextSeq
						}, { where: { id: p.id } });
						pUpdated += 1;
					} catch (e) {
						console.error(`❌ Failed updating proposal ${p.id}:`, e?.message || e);
						pErrors += 1;
					}
			}
			console.log(`\n📈 Proposals backfill summary: examined=${pExamined} updated=${pUpdated} skipped=${pSkipped} errors=${pErrors}`);
		}

		console.log(`\n✅ Orders backfill summary:`);
		console.log(summarize);
	} catch (e) {
		console.error('❌ Backfill error:', e?.message || e);
		if (e?.stack) console.error(e.stack);
		process.exitCode = 1;
	} finally {
		try { await require('./config/db').close(); } catch (_) {}
	}
}

main().then(() => process.exit(0));

