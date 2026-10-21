# Supplier compatibility repairs — 2026-10-21

## Candidate scope

The vocabulary includes twelve fixed source binary selectors and unary
complement. Preserve their Code, block and decompile contracts; arbitrary
operator text is refused.

STM32 fixtures use the owned compiler's canonical reset startup and linker
scripts, initializing data/BSS and forwarding interrupts through the actual
runtime. Sensor readers follow the imported program's bindings. Light-sensor
coverage uses its declared three-terminal model. Source repairs require hosted
execution and build checks; local pure tests establish no ARM guest result.

## Canonical circuit adoption and fresh quantities

The workflow and sibling manifest explicitly adopt Circuit UI's canonical
`f65e6cc0027397dea42528db9225a135b1c8e8c5` merge. Board remains
`fac3a5a9928c8b53a778b0c42d8d91d5e693e4b7`.

The complete original quantity module ran against those actual source revisions:
ten tests, nine passing and one failing, without skips or TODOs. The sole failure
was the provenance check naming 31 stale EXPECTED blocks. Quantity and instrument
checks passed; every freshly derived checked, total, disagreement and declined
count matched its existing page.

The 31 replacements were read from that saved result, independently checked
against the original spans and applied verbatim. Only Board and Circuit UI
revision strings change. No number, exception, threshold or assertion changed.
The original failure is retained. This is model agreement, without firmware,
browser, physical-accuracy or complete Arcade application qualification.

## Next steps

1. Qualify the final commit through every enabled hosted check, including actual
   STM32 execution, fixed points and the complete quantity module.
2. Preserve failures and repair their causes. Do not rerun unchanged jobs or
   restore stale sibling pins to suppress failures.
3. Merge after every enabled final-head check passes. Consumers then adopt the
   canonical merge explicitly and qualify their affected execution, conversions,
   export/reimport and visible authoring paths.
