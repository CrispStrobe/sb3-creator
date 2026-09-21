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

/**
 * The block itself, so the writer and the gate cannot drift apart.
 *
 * It was only the SCRIPT that knew this shape. The gate checked that the two
 * revision strings appeared somewhere in the page and nothing checked the
 * three counts beside them, so a stamp could advertise "15 of this page's 28
 * numeric claims (2 of them disagreeing)" while the page held 30 claims and
 * disagreed with none. Six pages were in exactly that state, two of them
 * still reporting disagreements that had been fixed — the stamp is a
 * checkable claim, and it was the only claim on these pages nothing checked.
 *
 * `%DIR%` is substituted by the caller with the example directory.
 */
export const provenanceStamp = (boardRev, cuiRev, checked, mismatched, total) => [
    MARK,
    '> **Engine provenance.** The measured numbers on this page were last held against',
    `> \`bw-board@${boardRev}\` and \`bw-circuit-ui@${cuiRev}\` — the revisions pinned in`,
    '> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares',
    `> **${checked + mismatched} of this page's ${total}** numeric claims against that engine`,
    `> (${mismatched} of them disagreeing) and declines the rest with a stated reason;`,
    '> `node scripts/expected-claim-census.mjs %DIR%` prints them one by one.',
    MARK,
].join('\n');
