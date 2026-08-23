/**
 * The off-thread half of the starve hook. See starve-hook.mjs.
 *
 * It announces every swap on stderr ("BW_STARVE: swapped …") because a starve
 * that silently did nothing is indistinguishable from a robust gate, and that
 * confusion is the specific failure this whole audit exists to stop.
 */
let FROM = null;
let TO = null;

export function initialize (data) {
    FROM = data.from;
    TO = data.to;
}

export async function resolve (specifier, context, nextResolve) {
    const r = await nextResolve(specifier, context);
    if (FROM && r.url === FROM) {
        process.stderr.write(`BW_STARVE: swapped ${FROM} -> ${TO}\n`);
        return { ...r, url: TO, shortCircuit: true };
    }
    return r;
}
