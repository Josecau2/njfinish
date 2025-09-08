import React from 'react'

// Simple accessible skeleton for merging styles; UI-only scaffold.
// Props:
// - leftStyles, rightStyles: arrays of options
// - onMerge: (leftId, rightId) => void
export default function StyleMerger({ leftStyles = [], rightStyles = [], onMerge }) {
	const [left, setLeft] = React.useState('')
	const [right, setRight] = React.useState('')

	const submit = (e) => {
		e.preventDefault()
		if (!left || !right || left === right) return
		onMerge && onMerge(left, right)
	}

	return (
		<form className="style-merger" onSubmit={submit}>
			<style>{`
				.style-merger { display: grid; gap: .75rem; }
				.style-merger__row { display: grid; grid-template-columns: 1fr 1fr; gap: .5rem; }
				@media (max-width: 576px){ .style-merger__row { grid-template-columns: 1fr; } }
				.style-merger select, .style-merger button { min-height: 44px; }
				.style-merger__btn { border: 1px solid var(--border, #e5e7eb); border-radius: 8px; background: #fff; }
				.style-merger__btn:focus-visible { outline: 2px solid color-mix(in oklch, var(--color-primary, #0d6efd) 40%, transparent); outline-offset: 2px; }
			`}</style>
			<div className="style-merger__row" role="group" aria-label="Select styles to merge">
				<label className="d-flex flex-column gap-1">
					<span className="small text-muted">From</span>
					<select value={left} onChange={(e) => setLeft(e.target.value)} aria-label="Source style">
						<option value="" disabled>Choose source style…</option>
						{leftStyles.map((s) => (
							<option key={s.value ?? s.id} value={s.value ?? s.id}>{s.label ?? s.name ?? s.id}</option>
						))}
					</select>
				</label>
				<label className="d-flex flex-column gap-1">
					<span className="small text-muted">Into</span>
					<select value={right} onChange={(e) => setRight(e.target.value)} aria-label="Target style">
						<option value="" disabled>Choose target style…</option>
						{rightStyles.map((s) => (
							<option key={s.value ?? s.id} value={s.value ?? s.id}>{s.label ?? s.name ?? s.id}</option>
						))}
					</select>
				</label>
			</div>
			<div>
				<button type="submit" className="style-merger__btn" aria-label="Merge styles" disabled={!left || !right || left === right}>Merge</button>
			</div>
		</form>
	)
}

