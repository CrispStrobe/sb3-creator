// The LED cube's shift directions, in wire order.
//
// One list, imported by both sides, because there were two and they disagreed.
// The emitter had `{ up: 0, down: 1, left: 2, right: 3, forward: 4, back: 5 }`
// inline; the reader had the array, with a comment reading "must agree with the
// emitter's ...". A comment is not a constraint. `shift cube up` emitted
// `bw_cube_shift(0)`, came back as `shift cube 0`, and was then dropped as an
// unrecognised statement — the round trip lost the block entirely.
//
// The index IS the wire value, so the order of this array is a compatibility
// promise: appending is safe, reordering silently changes what already-compiled
// firmware means. Add to the end.
export const CUBE_DIRECTIONS = ['up', 'down', 'left', 'right', 'forward', 'back'];

/** Wire value for a direction word, or -1 if it is not one. */
export function cubeDirectionIndex (word) {
    return CUBE_DIRECTIONS.indexOf(String(word).trim().toLowerCase());
}

/** Direction word for a wire value, or null if it is out of range. */
export function cubeDirectionWord (index) {
    const i = Number(index);
    return Number.isInteger(i) && i >= 0 && i < CUBE_DIRECTIONS.length
        ? CUBE_DIRECTIONS[i]
        : null;
}
