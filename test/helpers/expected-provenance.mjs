/**
 * What an engine-derived EXPECTED.md must carry, and how to recognise one.
 *
 * Kept apart from `scripts/stamp-expected-provenance.mjs` on purpose: the gate
 * needs these two values and the script needs to WRITE files, and importing a
 * script for its constants runs its main. That is how a test comes to rewrite
 * the corpus it is checking.
 */

/** Delimits the generated block, so a rewrite replaces rather than appends. */
export const MARK = '<!-- engine-provenance -->';

/**
 * A page that quotes a solve — these are the ones whose numbers move when the
 * engine does, and the ones that must therefore name the revision they were
 * derived against.
 */
export const isDerived = (text) =>
    /audit-solve|measured on the engine|Measured on bw-board|\(measured[,)]|Measured \(`/i.test(text);
