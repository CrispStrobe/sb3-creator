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
persistence, and desktop/narrow browser operation. Upstream changes are
qualified before exact downstream adoption; local checks are not hosted CI.

