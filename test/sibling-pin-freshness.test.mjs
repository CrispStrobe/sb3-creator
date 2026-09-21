/**
 * THE ENGINE THESE GATES MEASURE AGAINST MUST NOT BE OLD.
 *
 * Nothing here was ever wrong in isolation. The sibling pins were exact, their
 * justifications were written, `gate-integrity` proved actions/checkout could
 * fetch them, and every one of 7,451 tests passed. The corpus was nonetheless
 * certifying an engine NOBODY RAN: on 2026-09-21 the pinned bw-board was
 * 7b7f3b50, dated 2026-09-08 and 1,409 commits behind its own master, while
 * brickwright-lite — the app these examples ship inside — had moved on. So
 * 21-resistor-led asserted 2.13 V, passed, and the learner saw 1.94 V.
 *
 * A green gate about the wrong engine is worse than a red one, because nothing
 * asks the question. This file asks it.
 *
 * WHAT IS MEASURED, AND WHY THIS AND NOT SOMETHING EASIER. The subject is the
 * AGE OF THE PINNED COMMIT — `git log -1` on the sibling checkout CI already
 * makes, which works at the default fetch-depth of 1. Two alternatives were
 * considered and rejected:
 *
 *   - "days since we last edited siblings.json" needs this repo's own history,
 *     which CI does not fetch, and is rubber-stampable: touch the date, stay
 *     green, keep the stale engine.
 *   - "commits behind master" is the number one actually wants, but counting it
 *     needs the sibling's full history or a network call from a test. Both are
 *     ambient bindings this repo deliberately avoids.
 *
 * Commit age is neither. It needs no history and no network, and it CANNOT be
 * satisfied except by pinning a newer upstream commit — the one action that
 * actually fixes the problem.
 *
 * THE BOUND, and what it buys. MEASURED over the drift this gate exists to
 * prevent: bw-board moved 1,409 commits in the 13 days between 7b7f3b50 and its
 * discovery, about 108 commits a day.
 *
 * The first draft of this file set the bound at 14 and its own mutation test
 * caught it: 13 is under 14, so the gate would have fired two days AFTER a human
 * happened to look, and the comment claiming otherwise was simply false. A bound
 * that does not fire on the episode it was written for is decoration.
 *
 * 10 days fires on day eleven — two days before that discovery — and still
 * leaves more than a week of ordinary slack, so a normal week-plus-a-weekend
 * cadence never trips it. At the measured rate it admits roughly 1,100 commits
 * of drift even so. That is the honest cost of a date-shaped proxy, and the
 * reason the failure message tells you to go and count the real number rather
 * than trusting this one.
 *
 * Red names the sibling, the pinned sha, its date, its age, and the command
 * that turns this proxy into the measurement.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { requireSiblings, siblingGuardTest } from './helpers/siblings.mjs';

const gate = requireSiblings('bw-board', 'bw-circuit-ui');
siblingGuardTest(gate, 'the sibling pin freshness check');
const SKIP = gate.skip || false;

/** Days. See the header: it must FIRE on the 13-day / 1,409-commit episode. */
export const MAX_PIN_AGE_DAYS = 10;

const SIBLINGS = JSON.parse(readFileSync(
    new URL('./fixtures/siblings.json', import.meta.url), 'utf8')).siblings;

/** Pure, so the mutation test can drive it without a checkout. */
export const ageInDays = (commitDate, today) =>
    Math.floor((Date.parse(today + 'T00:00:00Z') - Date.parse(commitDate + 'T00:00:00Z')) / 86400000);

const headOf = dir => execFileSync('git', ['-C', dir, 'rev-parse', 'HEAD'], {encoding: 'utf8'}).trim();
const dateOf = dir => execFileSync('git', ['-C', dir, 'log', '-1', '--format=%cs', 'HEAD'], {encoding: 'utf8'}).trim();

describe('the pinned siblings are the engine the app runs, not one it used to', {skip: SKIP}, () => {
    test('each sibling checkout IS the pinned commit', () => {
        // Without this the age below would be measured on some other commit —
        // a confident number about the wrong subject.
        for (const [name, meta] of Object.entries(SIBLINGS)) {
            assert.equal(headOf(gate.paths[name]), meta.rev,
                `${name}: the checkout is not at the pin, so nothing measured from it means anything`);
        }
    });

    test(`no pinned commit is older than ${MAX_PIN_AGE_DAYS} days`, () => {
        const today = new Date().toISOString().slice(0, 10);
        const stale = [];
        for (const [name, meta] of Object.entries(SIBLINGS)) {
            const committed = dateOf(gate.paths[name]);
            const age = ageInDays(committed, today);
            if (age > MAX_PIN_AGE_DAYS) {
                stale.push(`${name} @ ${meta.rev.slice(0, 8)} was committed ${committed}, ${age} days ago`
                    + ` — count the real drift with:  git -C <${name} checkout> rev-list --count ${meta.rev.slice(0, 8)}..origin/master`);
            }
        }
        assert.deepEqual(stale, [],
            'a pinned sibling has gone stale. This gate exists because 7b7f3b50 sat here for 13 days '
            + 'and drifted 1,409 commits while every test passed, so the gallery asserted voltages the '
            + 'app did not show. Re-pin to the sibling\'s master, re-derive whatever moves, and write '
            + 'the why into test/fixtures/siblings.json — or, if the pin must hold, say so THERE with '
            + 'the measurement that justifies it:\n  ' + stale.join('\n  '));
    });
});

describe('the freshness rule itself', () => {
    test('MUTATION: the age arithmetic is what the bound is applied to', () => {
        assert.equal(ageInDays('2026-09-08', '2026-09-21'), 13);
        assert.equal(ageInDays('2026-09-21', '2026-09-21'), 0);
        // THE LOAD-BEARING ONE. The pin that cost 1,409 commits of drift must
        // cross this bound, or the gate is decoration — which is exactly what
        // the first draft was, at 14 days, until this assertion said so.
        assert.ok(ageInDays('2026-09-08', '2026-09-21') > MAX_PIN_AGE_DAYS,
            `the 13-day episode this gate exists for does not cross a ${MAX_PIN_AGE_DAYS}-day bound`);
        // And a pin taken today must not fire, or nobody can ever be green.
        assert.ok(ageInDays('2026-09-21', '2026-09-21') <= MAX_PIN_AGE_DAYS);
        // A week plus a weekend is ordinary cadence and must survive.
        assert.ok(ageInDays('2026-09-12', '2026-09-21') <= MAX_PIN_AGE_DAYS,
            'nine days is a normal cadence; a bound that fires there is a nuisance, not a gate');
    });

    test('the fixture this reads is the one CI checks out', () => {
        // Same file gate-integrity holds equal to the workflow refs, so a pin
        // cannot be fresh here and stale there.
        assert.deepEqual(Object.keys(SIBLINGS).sort(), ['bw-board', 'bw-circuit-ui']);
        for (const meta of Object.values(SIBLINGS)) assert.match(meta.rev, /^[0-9a-f]{40}$/);
    });
});
