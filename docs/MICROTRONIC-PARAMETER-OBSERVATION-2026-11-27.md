# Microtronic gallery and parameter observation — 2026-11-27

## Existing canonical source

This continuation reviewed the complete nine-file range of
[PR #237](https://github.com/CrispStrobe/sb3-creator/pull/237), from
`b76c34e38e58ad1e1bcf5dfd9f4b0dec0ed2e37f` to
`0491192eaff4a99fdb19ea5a4a567f0c810d9623`, against the current console/Python
candidate `30897caab3854e3f72545dd81f7cb6aa5dbd494d`.

Main already received the canonical Microtronic lesson through
[PR #238](https://github.com/CrispStrobe/sb3-creator/pull/238), including
`312fa6b0` and the expected-behavior follow-up `0e75fbde`. The circuit and both
introductions are byte-identical to PR #237 and to the consumer's existing
Microtronic files. Its catalog entry and four-gate enrollment are also identical.
The current catalog and generated enrollment cover **802 examples**; their
existing new lessons and thresholds are retained. The current five-line
`EXPECTED.md` remains unchanged.

The older PR's CUI pin move and whole enrollment file are not carried over.
Current sibling inputs remain:

| Input | Exact revision |
| --- | --- |
| bw-board | `de8083c5a894a49c9fa4c6f0fb6f8866e2d758c0` |
| bw-circuit-ui | `ee2b4127a88f1b308f8d749cae4d7c1db1deae9e` |

## Remaining defect and correction

Main's `e05dd0fb` replaced the old parameter observer with a shared helper and
four shards, preserving whole machine state and BigInt values. That repaired
several observation gaps, but exposed a distinct false positive for the
Microtronic rate: `getDeviceState()` includes `_paramsInstructionHz`, a copy of
the authored parameter used to detect edits.

Before this correction, the exact observer reported **20 → 75 instructions/s**
as live while both machines remained halted. No node voltage, branch current,
lamp brightness or buzzer observation changed. An in-memory engine mutant that
replaced the instruction-period read with the constant `20` still passed,
because the cached authored values remained `20` and `75`.

The shared observer now carries PR #237's public **Run** action and
Microtronic-only 1/100 ms sweep, followed by the driven-input pass at 101/200 ms.
Every other bench retains its existing observation times. For Microtronic
device-state observations, it removes only `_paramsProgram` and
`_paramsInstructionHz`, the two copied-input caches. The complete program,
registers, clock, scheduler and output state remain observable, including
BigInt fields. The four-shard structure, perturbations, assertions, thresholds
and exemption maps are unchanged.

## Executable evidence

The new `test/microtronic-parameter-observer.test.mjs` exercises the actual shared
observer and `probeKeys()` verdict through the canonical `injectEngine()`
surface. Each control runs in a fresh process. The negative control changes
exactly one engine expression through a module-loading hook and verifies that
the sibling source file's SHA-256 remains unchanged. A state-read wrapper calls
through without altering the returned state; it records actual execution.

Measured locally with Node `v24.22.3` and the exact sibling revisions above:

| Observation at the end of the sweep | Normal engine | Engine ignoring the rate |
| --- | --- | --- |
| Instructions executed at authored 20 Hz | 4 | 4 |
| Instructions executed after perturbation to 75 Hz | 15 | 4 |
| Node voltages changed by the perturbation | 12 | 0 |
| Lamps changed | `lamp1`, `lamp2`, `lamp3` | None |
| Actual tier-2 verdict | Live; no inert/unprobeable/healed entries | Inert; one site probed, none moved |
| Cached authored rates retained by the engine | 20 and 75 | 20 and 75 |

Both substantive new controls fail when the previous committed observer is
loaded in memory: the normal control sees no execution, and the ignored-rate
engine is wrongly admitted. The corrected observer passes both controls.

The bounded local batch passes **34/34 with no skips**: the new observer controls,
catalog kind, enrollment, index metadata and canonical engine-surface controls.
The focused gallery run passes **4 checks**, with **8 ordinary program-only
skips** for this circuit-only lesson. The official enrollment generator reports
the existing 802-example file up to date; no generated file was rewritten.

```sh
BW_BOARD=/path/to/exact/bw-board BW_CIRCUIT_UI=/path/to/exact/bw-circuit-ui \
  node --test test/microtronic-parameter-observer.test.mjs \
  test/example-kind-matches-content.test.mjs \
  test/example-gate-enrolment.test.mjs \
  test/index-metadata-matches-disk.test.mjs \
  test/engine-surface-adoption.test.mjs
node scripts/gen-example-enrolment.mjs
```

## Historical CI and remaining qualification

PR #237's latest inspected
[run 45716328604](https://github.com/CrispStrobe/sb3-creator/actions/runs/45716328604)
passed browser rendering. Its source job
[139563206971](https://github.com/CrispStrobe/sb3-creator/actions/runs/45716328604/job/139563206971)
failed and reached the 30-minute timeout. The recorded witnesses were a
lab-chopper-tacho flyback invariant, the old single-file parameter timeout,
branch-current disagreements, zero-current CP1/thyristor subjects, the
lab-tilt-comparator 6.7 mV claim, stale CUI provenance blocks, CP1 relay-bank
source sag, and an unaccounted catalog `target` field. Those are historical
results for its e744/0a input pair. Later main includes separate metadata,
source-sag, claim and parameter-observer changes; the old red run does not
establish that each finding still occurs on today's inputs.

This checkpoint qualifies the bounded observation repair and confirms that
the canonical gallery source is already present. It does not qualify the
pending RF engine correction, change sibling pins, renew the complete
EXPECTED provenance corpus, or advance the consumer's supplier pin. Those
remain joint integration steps: qualify the RF upstream revision, deliberately
adopt exact sibling inputs, perform the required complete source measurements
and generated provenance updates, then run supplier qualification and the
consumer's official compiler/gallery synchronization and affected gates.
