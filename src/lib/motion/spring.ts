/**
 * Apple-style spring helpers (WWDC Designing Fluid Interfaces).
 * Think in damping ratio + response — not mass/stiffness.
 */

export interface SpringParams {
	/** 1 = critically damped (no bounce); <1 = overshoot. Sheet flick ≈ 0.8 */
	dampingRatio: number;
	/** Seconds to settle feel — not a fixed duration. Sheet ≈ 0.3–0.4 */
	response: number;
}

export const SPRING_UI: SpringParams = { dampingRatio: 1, response: 0.38 };
export const SPRING_SHEET: SpringParams = { dampingRatio: 0.86, response: 0.32 };
export const SPRING_SHEET_SETTLE: SpringParams = { dampingRatio: 1, response: 0.36 };

export function springConstants({ dampingRatio, response }: SpringParams) {
	const angular = (2 * Math.PI) / Math.max(0.05, response);
	const stiffness = angular * angular;
	const damping = 2 * dampingRatio * angular;
	return { stiffness, damping };
}

/** Exponential-decay projection Apple ships (not v²/2a). */
export function project(initialVelocity: number, decelerationRate = 0.998): number {
	return ((initialVelocity / 1000) * decelerationRate) / (1 - decelerationRate);
}

/** Soft edge resistance — progressive, never a hard stop. */
export function rubberband(overshoot: number, dimension: number, constant = 0.55): number {
	return (overshoot * dimension * constant) / (dimension + constant * Math.abs(overshoot));
}

export interface SpringState {
	value: number;
	velocity: number;
}

/**
 * Advance a 1D spring by `dt` seconds. Returns whether it's settled enough to stop.
 */
export function stepSpring(
	state: SpringState,
	target: number,
	dt: number,
	params: SpringParams,
	restDelta = 0.4,
	restVelocity = 8
): boolean {
	const { stiffness, damping } = springConstants(params);
	// Clamp dt to avoid spiral-of-death on tab background
	const t = Math.min(dt, 1 / 30);
	const displacement = state.value - target;
	const springForce = -stiffness * displacement;
	const dampForce = -damping * state.velocity;
	state.velocity += (springForce + dampForce) * t;
	state.value += state.velocity * t;

	if (
		Math.abs(state.value - target) < restDelta &&
		Math.abs(state.velocity) < restVelocity
	) {
		state.value = target;
		state.velocity = 0;
		return true;
	}
	return false;
}

/** Velocity from a short pointer history (px/s). */
export function velocityFromHistory(
	history: Array<{ y: number; t: number }>,
	samples = 5
): number {
	if (history.length < 2) return 0;
	const last = history[history.length - 1];
	const first = history[Math.max(0, history.length - samples)];
	const dt = last.t - first.t;
	if (dt <= 0) return 0;
	return ((last.y - first.y) / dt) * 1000;
}
