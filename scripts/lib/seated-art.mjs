/**
 * How the canvas draws a seated part: its art, or the box fallback.
 *
 * bw-circuit-ui's BoardCanvas `artFace()` draws an art-face kind
 * (ART_FACE_KINDS) with its vendored art when every terminal is one of the
 * art's legs, and — seated — only when `seatedArtClean(artFaceLayout(sidecar,
 * holes))` holds: every lead leaves the art outward and no two leads cross.
 * A part seated where its legs cannot honestly reach (a DIP a saved circuit
 * seated mirror-image under the pre-2026-11-24 footprints) keeps its box.
 * This is the same test, run headless, with the canvas's own rotate/flip.
 *
 * Needs an engine with every bw-circuit-ui sidecar registered (the app's load):
 * the art and the footprints of sidecar-only kinds come from them.
 */

/** BoardCanvas's rotateOffset (quarter turns only; anything else is identity). */
function rotateOffset(dx, dy, deg) {
    switch (((deg % 360) + 360) % 360) {
        case 90: return { dx: -dy, dy: dx };
        case 180: return { dx: -dx, dy: -dy };
        case 270: return { dx: dy, dy: -dx };
        default: return { dx, dy };
    }
}

/**
 * @param {{cuiURL: URL, Circuit: any}} E an injected engine, sidecars registered
 */
export async function loadSeatedArt(E) {
    const cui = (p) => import(new URL(p, E.cuiURL).href);
    const { resolveSeatedParts } = await cui('src/interaction/seat-geometry.js');
    const { ART_FACE_KINDS, artSidecarFor, artPinOffsets, artFaceLayout, seatedArtClean } = await cui('src/model/part-art.js');
    const { getSidecar } = await cui('src/model/parts-registry.js');

    /**
     * How the canvas draws one part already passed through resolveSeatedParts:
     *   'art'   its art, legs in (or led cleanly into) their holes
     *   'box'   an art kind whose seat the art cannot reach — the fallback
     *   'legs'  an art kind whose terminal list is not the art's legs: the canvas
     *           draws its other layout, for a reason unrelated to the seat
     *   'other' not seated, or not an art kind (drawn by its own face)
     */
    function seatedFace(part) {
        if (!part._seatTerminals || part.sourcePackage === 'unspecified') return 'other';
        if (!ART_FACE_KINDS.includes(part.kind)) return 'other';
        const sc = artSidecarFor(getSidecar(part.kind), part.params)?.sc;
        if (!sc) return 'other';
        const legs = artPinOffsets(sc);
        if (!artFaceLayout(sc) || !legs || !(part.terminals || []).every(n => legs[n])) return 'legs';
        const rot = part.rotation || 0;
        const holes = {};
        for (const [name, p] of Object.entries(part._seatTerminals)) {
            const q = rotateOffset(p.x - part.x, p.y - part.y, (360 - (((rot % 360) + 360) % 360)) % 360);
            holes[name] = part.flipped ? { dx: -q.dx, dy: q.dy } : q;
        }
        return seatedArtClean(artFaceLayout(sc, holes)) ? 'art' : 'box';
    }

    /** Every seated part of a circuit JSON and how the canvas draws it. */
    function seatedFaces(json) {
        const c = E.Circuit.fromJSON(JSON.parse(JSON.stringify(json)));
        return resolveSeatedParts(c.parts).filter(p => p.seat && p.kind !== 'breadboard')
            .map(p => ({ id: p.id, kind: p.kind, face: seatedFace(p) }));
    }

    return { seatedFace, seatedFaces, resolveSeatedParts };
}
