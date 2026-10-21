# Cross-repository startup and sensor source readers

The STM32 test compilers use the startup assembly and flash linkers from
`CrispStrobe/stc-compiler` commit `a043daa58c2437f936f94971b3b0695c9c2510cb`.
The exact MIT files, licence, sizes and SHA-256 digests are retained under
`test/fixtures/stm32-service/`. The shared staging helper checks those bytes
before passing the service's startup flags to the original compiler commands.

Reset first copies initialized data from flash into SRAM and clears BSS, then
calls the generated `main`. The first vector table belongs to that adapter;
interrupts forward through IPSR to the generated program's unchanged vector
table. Generated clock setup, scheduler code and test expectations are retained.
Pico and 8051 compiler paths keep their existing inputs. These source changes
require complete affected hosted compiler and guest tests; a source check or a
successful service deployment alone does not qualify their execution.

The parameter source reader follows literal keys through a relative named import
whose exported function reads its first argument's `params` with its second
formal. This includes the real `world.ambient` path used by DS18B20. Tier 1 still
only discovers keys mentioned by engine code; the independent per-kind behavioral
gate retains its existing thresholds and exceptions.

The canonical `light_sensor` is a powered three-terminal divider, separate from
the two-terminal LDR. Its existing block coverage is explicit stimulus control
and observation of the output-node voltage. No LDR alias or new device-specific
block behavior is claimed.
