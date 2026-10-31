// Hover intent for a list of rows: a row counts as "pointed at" once the mouse rests on it,
// so a pointer that only crosses rows on its way somewhere never triggers anything.
//
// - One delegated listener on the list, for the mouse only (touch and pen taps are clicks).
// - The pointer rests when it stays within `tolerance` px of one point for `delay` ms. Moving
//   further away, or onto another row, starts the wait again from the new point.
// - Events whose position equals the last one are ignored: rows sliding under a still pointer
//   while the list scrolls are not a rest.
// - Leaving the list cancels a pending wait. `onLeave` reports when the pointer leaves the row
//   it rested on (the hover card closes then; the side panel keeps its item).

export interface HoverIntentOptions {
	/** Rows: elements matching this selector. */
	selector: string;
	delay?: number;
	tolerance?: number;
	onRest: (row: HTMLElement) => void;
	onLeave?: (row: HTMLElement) => void;
}

export function hoverIntent(list: HTMLElement, options: HoverIntentOptions) {
	const { selector, delay = 150, tolerance = 6, onRest, onLeave } = options;
	let timer: ReturnType<typeof setTimeout> | undefined;
	let pending: HTMLElement | null = null;
	let rested: HTMLElement | null = null;
	let anchorX = NaN;
	let anchorY = NaN;
	let lastX = NaN;
	let lastY = NaN;

	const cancel = () => {
		clearTimeout(timer);
		timer = undefined;
		pending = null;
	};

	const leave = () => {
		if (rested) {
			const row = rested;
			rested = null;
			onLeave?.(row);
		}
	};

	function move(e: PointerEvent) {
		if (e.pointerType !== 'mouse') return;
		if (e.clientX === lastX && e.clientY === lastY) return;
		lastX = e.clientX;
		lastY = e.clientY;
		const row = (e.target as Element | null)?.closest<HTMLElement>(selector) ?? null;
		if (row !== rested) leave();
		if (!row || !list.contains(row)) return cancel();
		const far = Math.hypot(e.clientX - anchorX, e.clientY - anchorY) > tolerance;
		if (row === pending && !far) return;
		cancel();
		pending = row;
		anchorX = e.clientX;
		anchorY = e.clientY;
		timer = setTimeout(() => {
			const target = pending;
			cancel();
			if (!target?.isConnected) return;
			rested = target;
			onRest(target);
		}, delay);
	}

	function out(e: PointerEvent) {
		if (e.pointerType !== 'mouse') return;
		cancel();
		leave();
		lastX = lastY = NaN;
	}

	list.addEventListener('pointermove', move);
	list.addEventListener('pointerleave', out);
	return {
		/** Forget the current rest (after a click, a scroll or Esc closed what it opened). */
		reset() {
			cancel();
			rested = null;
		},
		destroy() {
			cancel();
			list.removeEventListener('pointermove', move);
			list.removeEventListener('pointerleave', out);
		}
	};
}
