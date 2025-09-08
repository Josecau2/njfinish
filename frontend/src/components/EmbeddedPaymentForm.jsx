import React, { useEffect, useRef } from 'react';

// Lightweight, framework-agnostic embed container for external payment widgets (Stripe, Square, etc.)
// Props:
// - src: string | URL of the hosted payment form to embed in an iframe
// - title: string | accessible title for the iframe
// - onLoad?: function | called when frame loads
// - height?: number | fallback height (px) if the embed cannot auto-size
// - allow?: string | iframe allow attributes (e.g., 'payment *; autoplay *')
// - sandbox?: string | sandbox flags if needed
// - className?: string | additional classes
export default function EmbeddedPaymentForm({
	src,
	title = 'Secure payment',
	onLoad,
	height = 780,
	allow = 'payment *; clipboard-write *',
	sandbox,
	className = '',
}) {
	const frameRef = useRef(null);

	useEffect(() => {
		// Optional postMessage-based auto-height pattern if the provider supports it
		const onMessage = (e) => {
			try {
				if (!e?.data || typeof e.data !== 'object') return;
				if (e.data.type === 'embed:resize' && e.data.height && frameRef.current) {
					frameRef.current.style.height = `${Math.max(400, Number(e.data.height))}px`;
				}
			} catch (_) { /* noop */ }
		};
		window.addEventListener('message', onMessage);
		return () => window.removeEventListener('message', onMessage);
	}, []);

	return (
		<div className={`payment-embed ${className}`}>
			{/* Scoped responsive/touch styles */}
			<style>{`
				.payment-embed { width: 100%; max-width: 900px; margin-inline: auto; }
				.payment-embed__frame { width: 100%; border: 0; border-radius: 12px; background: #fff; box-shadow: var(--shadow-sm, 0 1px 2px rgba(0,0,0,.06)); }
				.payment-embed__wrap { padding: 0; }
				@media (max-width: 576px) {
					.payment-embed__wrap { padding: .5rem; }
				}
			`}</style>
			<div className="payment-embed__wrap">
				<iframe
					ref={frameRef}
					className="payment-embed__frame"
					src={src}
					title={title}
					height={height}
					allow={allow}
					sandbox={sandbox}
					scrolling="no"
					aria-label={title}
					onLoad={onLoad}
				/>
			</div>
		</div>
	);
}
