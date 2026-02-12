/**
 * Haptic feedback using the Vibration API.
 * Falls back silently on devices that don't support it.
 */

function vibrate(pattern: number | number[]) {
    if (typeof window !== "undefined" && "vibrate" in navigator) {
        try {
            navigator.vibrate(pattern);
        } catch {
            // silently ignore
        }
    }
}

/** Light tap — card selection, button press */
export function hapticLight() {
    vibrate(10);
}

/** Medium tap — stay action, round end */
export function hapticMedium() {
    vibrate(25);
}

/** Heavy — bust, game over */
export function hapticHeavy() {
    vibrate([30, 50, 30]);
}

/** Success — Flip 7 achieved, game won */
export function hapticSuccess() {
    vibrate([15, 40, 15, 40, 30]);
}
