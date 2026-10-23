# School compiler CI toolchain download repair

CLAIMED — Codex school-circuit owner. Base 7d547d95; isolated supplier branch
`lane/school-compiler-ci-downloads-claim-20261023`. Merge before implementation.
Preserve the current Widgets candidate and all other owners.

The first Widgets CI job spent 69 minutes in apt installation. Its original
log records repeated stalls at the Azure HTTP mirror, 579 MB of selected
archives and a 463 MB ARM C++ newlib package; fallback to the official HTTPS
Ubuntu archive completed that final package in seconds. Current MCU chain
fixtures compile freestanding C with `-nostdlib`, with `-lgcc` where required.

Own only the cross-compiler installation step in `.github/workflows/ci.yml`,
this claim and narrow executable workflow controls if needed. Prefer the
existing official Ubuntu HTTPS archive mirror through the ephemeral runner's
apt mirror list, preserve signature checking and the runner's package versions,
install gcc-arm-none-eabi, the ARM C newlib library/headers and SDCC explicitly,
and omit recommended C++/documentation payloads. Keep transport attempts
bounded and visible. Do not remove either compiler or any test, change tool
versions, raise timeouts/tolerances/ceilings, alter source or sibling pins,
add a warm-cache-only assumption or claim hosted success from a local mock.

Compose into the same owner's Widgets candidate. Verify the actual final
hosted job installs both toolchains and passes every enabled original check.
Preserve the original failed test head and slow installation evidence; do not
rerun unchanged source or interfere with other branches/workflows.
