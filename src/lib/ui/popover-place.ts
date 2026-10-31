// Places a menu popover (position: fixed, in the top layer) against the button that opens it:
// below the button, or above it when there is clearly more room there, aligned to the
// button's start or end edge, never wider than the screen. The height is capped to the room
// left in the visual viewport, so a phone keyboard never hides the end of the list.

export interface PlaceOptions {
	align?: 'start' | 'end';
	/** Height the menu wants (its content), to decide whether it fits below. */
	wanted: number;
	/** Upper bound for the menu's height. */
	cap?: number;
	minWidth?: number;
	/** Distance kept from the screen edges. */
	margin?: number;
	gap?: number;
}

export function placePopover(trigger: HTMLElement, popover: HTMLElement, options: PlaceOptions) {
	const { align = 'start', wanted, cap = Infinity, minWidth = 176, margin = 16, gap = 4 } = options;
	const r = trigger.getBoundingClientRect();
	const vw = document.documentElement.clientWidth;
	const vv = window.visualViewport;
	// The visible part of the layout viewport, in the same coordinates as getBoundingClientRect.
	const top = vv ? vv.offsetTop : 0;
	const bottom = vv ? vv.offsetTop + vv.height : window.innerHeight;
	const below = bottom - r.bottom - gap - margin;
	const above = r.top - gap - top - margin;
	const want = Math.min(wanted, cap);
	const up = want > below && above > below;
	const s = popover.style;
	const room = Math.max(120, up ? above : below);
	s.maxHeight = `${Math.min(room, cap)}px`;
	s.top = up ? 'auto' : `${r.bottom + gap}px`;
	s.bottom = up ? `${document.documentElement.clientHeight - r.top + gap}px` : 'auto';
	s.minWidth = `${Math.min(Math.max(r.width, minWidth), vw - 2 * margin)}px`;
	s.maxWidth = `${vw - 2 * margin}px`;
	const end = align === 'end' || r.left > vw - minWidth - margin;
	s.left = end ? 'auto' : `${Math.max(margin, Math.min(r.left, vw - margin - minWidth))}px`;
	s.right = end ? `${Math.max(margin, vw - r.right)}px` : 'auto';
	return { up, visible: r.bottom > top && r.top < bottom };
}

/**
 * Keeps an open popover on its button while anything scrolls or the viewport changes (a phone
 * keyboard opening, a rotation). Closes it once the button has left the screen.
 */
export function follow(trigger: HTMLElement, popover: HTMLElement, place: () => { visible: boolean }) {
	let frame = 0;
	const update = (e?: Event) => {
		if (e?.target instanceof Node && popover.contains(e.target)) return;
		cancelAnimationFrame(frame);
		frame = requestAnimationFrame(() => {
			if (!trigger.isConnected || !place().visible) popover.hidePopover();
		});
	};
	window.addEventListener('scroll', update, { capture: true, passive: true });
	window.addEventListener('resize', update);
	window.visualViewport?.addEventListener('resize', update);
	window.visualViewport?.addEventListener('scroll', update);
	return () => {
		cancelAnimationFrame(frame);
		window.removeEventListener('scroll', update, { capture: true });
		window.removeEventListener('resize', update);
		window.visualViewport?.removeEventListener('resize', update);
		window.visualViewport?.removeEventListener('scroll', update);
	};
}
