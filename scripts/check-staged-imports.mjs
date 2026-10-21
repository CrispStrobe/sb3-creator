#!/usr/bin/env node
//
// Refuse a commit that imports a file the commit does not contain.
//
// On 2026-08-09 `main` spent a while unable to start: sb3Creator.js imported
// ./cubeDirections.js, the import was swept into someone else's commit by
// `git add -A` while it sat uncommitted in the shared checkout, and the module
// itself was untracked so it was not swept with it. Every test passed for
// everyone who already had the file on disk. A clean clone failed at import.
//
// That is the whole failure mode: a working tree is not what you pushed. This
// checks the staged tree instead of the working tree, which is the only view
// that answers "will this work for someone who does not have my untracked
// files".
//
// Deliberately narrow. It does not lint, does not resolve node_modules, and
// does not care about import cycles — it answers one question about relative
// imports, and a check that answers one question is a check people leave on.

import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { missingRelativeImports, RELATIVE_IMPORT_CANDIDATES as CANDIDATES } from './lib/relative-imports.mjs';

const git = (...args) =>
    execFileSync('git', args, { encoding: 'utf8' }).trim();

const root = git('rev-parse', '--show-toplevel');

// Two modes, same question asked of two different trees.
//
//   (default)   the index — for a pre-commit hook, before the mistake exists
//   --tracked   everything committed — for CI, which has nothing staged and is
//               the last chance to notice before it is someone else's problem
//
// CI is the one that matters, because a hook only protects the machine that
// installed it, and the commit that broke main came from a session that had
// not.
const trackedMode = process.argv.includes('--tracked');

const tracked = new Set(git('ls-files').split('\n').filter(Boolean));
let toScan;

if (trackedMode) {
    toScan = [...tracked].filter(f => /\.(mjs|cjs|js|jsx)$/.test(f));
} else {
    // Files in the commit, as the commit will have them. Renames and copies get
    // their new name; deletions drop out, which is what we want — a deleted file
    // cannot satisfy an import.
    const staged = git('diff', '--cached', '--name-only', '--diff-filter=ACMR')
        .split('\n').filter(Boolean);
    toScan = staged.filter(f => /\.(mjs|cjs|js|jsx)$/.test(f));
    for (const f of staged) tracked.add(f);
    for (const f of git('diff', '--cached', '--name-only', '--diff-filter=D')
        .split('\n').filter(Boolean)) tracked.delete(f);
}

if (!toScan.length) process.exit(0);

// Parse real import/export syntax without treating test fixtures as modules.
// The helper uses the existing ESLint parser, including JSX, without loading
// configuration, transforming source or executing the inspected program.
const problems = [];
const parseProblems = [];
for (const file of toScan) {
    let source;
    try {
        source = trackedMode
            ? readFileSync(resolve(root, file), 'utf8')
            : execFileSync('git', ['show', `:${file}`], { encoding: 'utf8' });
    } catch {
        continue;                        // not in the index / not on disk
    }
    try {
        problems.push(...missingRelativeImports({root, file, source, tracked}));
    } catch (error) {
        // Parse uncertainty cannot silently remove a file from the census.
        parseProblems.push({file, message: error.message});
    }
}

if (problems.length || parseProblems.length) {
    console.error(trackedMode
        ? '\nthis branch imports files it does not contain\n'
        : '\ncommit refused: it imports files it does not contain\n');
    for (const {file, message} of parseProblems) {
        console.error(`  ${file}`);
        console.error(`      cannot inspect imports: ${message}`);
    }
    for (const { file, spec, expected } of problems) {
        console.error(`  ${file}`);
        console.error(`      imports '${spec}'  ->  ${expected}`);
        const onDisk = CANDIDATES.some(ext => existsSync(join(root, expected + ext)));
        console.error(onDisk
            ? (trackedMode
                ? '      the file exists on disk but was never committed — `git add` it'
                : '      the file exists on disk but is NOT staged — `git add` it')
            : '      no such file — check the path');
    }
    console.error(trackedMode
        ? '\nA clean clone of this branch fails at import. It works for anyone who\n'
          + 'already has the file untracked in their working tree, which is why the\n'
          + 'tests passed for the author.\n'
        : '\nThis passes on your machine and fails on a clean clone, which is\n'
          + 'why it is worth a hook: your working tree is not what you pushed.\n');
    process.exit(1);
}
