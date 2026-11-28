## CARDIAC Lab — REVIEW CANDIDATE, 2026-11-26

Default-branch claim publication is pending review. Automatic approval review refused direct default-branch pushes; implementation remains isolated on the feature branch until approval.

Owner: Brickwright CARDIAC implementation lane, requested by CrispStrobe.
Isolated branch: `feat/cardiac-lab-20261126`.
Base: `8aa66c500abcd0b99041a6d5f3351127095ac155`.
Scope: Original CARDIAC assembler and numeric deck/listing formats, source maps/diagnostics, original CARDIAC examples and focused semantic assembler tests. Shared compiler output reaches Brickwright via its defined sync.

Companion package boundaries: Brickwright, bw-board, bw-circuit-ui and
sb3-creator. Preserve all unrelated CP1, Microtronic, KIM and other work.
One authoritative machine and simulation clock; original CARDIAC opcode order.
Modern circuit I/O is explicitly identified as a Brickwright extension.
Independent code, lesson text and artwork; comparison implementations are
references, with license and semantic differences recorded. No historical
manual assets or incompatible emulator code are imported.

Qualify decimal overflow/shift/branch/input boundaries, source-to-memory
correspondence, actual circuit I/O, execution ownership, incomplete-source
persistence, and desktop/narrow browser operation. Exact supplier inputs and
scoped qualification are recorded below; unresolved wider hosted gates remain
visible and local checks do not replace them.

### CI supplier repair after the first draft review

The first draft [CI run 45791133905](https://github.com/CrispStrobe/sb3-creator/actions/runs/45791133905)
checked out Board `f48ea7ce962ea86f1a535bc2616d557cb66d71ba` and Circuit UI
`3084f357fb9e1aea5545b5593f375f9591e9888a`. Those older fixtures did not know
the CARDIAC and KIM-1 parts already present in the candidate's gallery. Its
bench-invariant and canonical load/save/load tests correctly rejected both
unknown kinds.

The workflow and `test/fixtures/siblings.json` now adopt the exact published
Board `0f6b38a8d6d3b15861ee7b35eda45e5db45035f2` and Circuit UI
`42aaddc8aaa93b4f584b2e9d81303b2673fdb9a5` candidates together. The existing
`scripts/stamp-expected-provenance.mjs` completed the full claim measurement
and restamped 313 `EXPECTED.md` files. Inspection confirms that only their two
pin strings changed; no numerical prose, comparison bounds or claim exceptions
were changed.

CI now runs all six CARDIAC examples plus six signed/zero/threshold boundary
cases against the actual pinned owning machine before its long generic suite.
It also runs the dedicated CARDIAC parameter observations from
`test/circuit-params-are-read.test.mjs`:

- A valid `ENTRY` mutation changes the executed night-light output. Adding
  ignored object metadata is no longer treated as a program perturbation.
- A nonblocking ADD/JMP program retires 20 versus 75 instructions in one Board
  second at 20 versus 75 Hz; accumulator values 10 versus 38 corroborate the
  actual instructions. No input wait or halt masks the rate.
- Static rendering of the actual pinned `CardiacPanel` exposes its Sample
  control for circuit input and Queue control for manual input, without
  executing an instruction. This observes the UI-owned preference through
  its owner, without claiming a browser interaction or an electrical effect.

Local qualification on the exact clean sibling checkouts: 48 assembler,
workflow, pin and integrity tests passed; both dedicated parameter checks and
all 12 program executions passed; all 2,875 canonical circuit load/save/load
cases passed. Scoped lint and whitespace checks passed. No ratchet was widened
and no kind was excluded to make these checks pass.

### Existing failures remain visible

The first hosted job also reported unrelated failures. The repaired local
bench-invariant run removes the CARDIAC/KIM failures and retains the same
`lab-chopper-tacho` motor without a correctly oriented flyback diode, already
named in the original job. The original job's device-current readback gaps,
four VHF claim mismatches, 900-second parameter-file timeout and 30-minute
overall test timeout are not represented as fixed by this pin repair.

The four `lab-vhf-superhet` mismatches are demonstrably older than CARDIAC:
[commit 2780bf45](https://github.com/CrispStrobe/sb3-creator/blob/2780bf45d299514e2f50c49606c4cf1506b51cf9/examples/lab-vhf-superhet/EXPECTED.md)
already records four disagreements with the old sibling pins. A bounded census
on the new exact pair still reports 43 claims: 16 checked, four mismatched and
23 declined. The unchanged checker reads two field-strength `mV/m` claims as
voltage and does not classify a dipole-based bench as it classifies an antenna
radio bench; those are separate follow-up questions, not waived claims here.

The replacement hosted run and broader upstream qualification remain required.
This review candidate is not an all-green CI or default-branch merge claim.
