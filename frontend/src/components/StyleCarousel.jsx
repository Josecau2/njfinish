import React, { useRef } from 'react'

// Lightweight, mobile-first horizontal carousel for style thumbnails.
// Props:
// - items: Array<{ id: string|number, name?: string, imageUrl?: string }>
// - selectedId?: string|number
// - onSelect?: (id) => void
// - title?: string
// - className?: string
export default function StyleCarousel({ items = [], selectedId, onSelect, title = 'Styles', className = '' }) {
	const scrollerRef = useRef(null)

	const scrollBy = (dx) => {
		const el = scrollerRef.current
		if (!el) return
		el.scrollBy({ left: dx, behavior: 'smooth' })
	}

	return (
		<div className={`style-carousel ${className}`}>
			<style>{`
				.style-carousel { width: 100%; }
				.style-carousel__head { display: flex; align-items: center; justify-content: space-between; gap: .5rem; margin-bottom: .5rem; }
				.style-carousel__title { font-weight: 600; font-size: 1rem; }
				.style-carousel__btn { min-height: 44px; min-width: 44px; padding: .25rem .5rem; border-radius: 8px; border: 1px solid var(--border, #e5e7eb); background: #fff; }
				.style-carousel__btn:focus-visible { outline: 2px solid color-mix(in oklch, var(--color-primary, #0d6efd) 40%, transparent); outline-offset: 2px; }
				.style-carousel__list { display: flex; gap: .5rem; overflow-x: auto; overscroll-behavior-x: contain; scroll-snap-type: x mandatory; padding-bottom: .25rem; }
				.style-carousel__item { flex: 0 0 auto; width: 140px; scroll-snap-align: start; border: 1px solid var(--border, #e5e7eb); border-radius: 10px; background: #fff; }
				.style-carousel__btnItem { display: block; width: 100%; text-align: left; background: transparent; border: 0; padding: .5rem; border-radius: 10px; }
				.style-carousel__thumb { width: 100%; height: 84px; border-radius: 8px; object-fit: cover; background: #f3f4f6; }
				.style-carousel__name { margin-top: .375rem; font-size: .875rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
				.style-carousel__item.is-selected { border-color: color-mix(in oklch, var(--color-primary, #0d6efd) 40%, #e5e7eb); box-shadow: 0 0 0 2px color-mix(in oklch, var(--color-primary, #0d6efd) 20%, transparent); }
				@media (max-width: 576px) { .style-carousel__item { width: 120px; } }
			`}</style>

			<div className="style-carousel__head">
				<div className="style-carousel__title" aria-live="polite">{title}</div>
				<div className="d-flex gap-2">
					<button type="button" className="style-carousel__btn" aria-label="Scroll left" onClick={() => scrollBy(-240)}>{'‹'}</button>
					<button type="button" className="style-carousel__btn" aria-label="Scroll right" onClick={() => scrollBy(240)}>{'›'}</button>
				</div>
			</div>

			<div
				ref={scrollerRef}
				className="style-carousel__list"
				role="list"
				aria-label="Style options"
			>
				{Array.isArray(items) && items.map((it) => {
					const id = it?.id ?? it?.value ?? it?.key
					const name = it?.name ?? it?.label ?? String(id)
					const isSel = selectedId != null && String(selectedId) === String(id)
					return (
						<div key={id} className={`style-carousel__item ${isSel ? 'is-selected' : ''}`} role="listitem">
							<button
								type="button"
								className="style-carousel__btnItem"
								onClick={() => onSelect && onSelect(id)}
								aria-pressed={isSel || undefined}
								aria-label={`Select style ${name}`}
							>
								{it?.imageUrl ? (
									<img className="style-carousel__thumb" src={it.imageUrl} alt="" aria-hidden />
								) : (
									<div className="style-carousel__thumb" aria-hidden />
								)}
								<div className="style-carousel__name" title={name}>{name}</div>
							</button>
						</div>
					)
				})}
				{(!items || items.length === 0) && (
					<div className="text-muted" style={{ padding: '.25rem .5rem' }} aria-live="polite">No styles</div>
				)}
			</div>
		</div>
	)
}

