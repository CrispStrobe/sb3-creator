# CrispBASIC portable source round trips

The explicit `crispbasic` mode converts a qualified BBC BASIC subset to
pseudocode and back. Converted source includes `# @crispbasic-portable 1` and
must continue to use CrispBASIC execution with a fresh portable simulation host.
This mode preserves the host's explicit millisecond clock, electrical input
reads and output latches. It does not qualify ordinary Blocks execution or
native MCU firmware.

## Reusable numeric procedures

The portable reader accepts `DEF PROCname` and `DEF PROCname(parameter,...)`
definitions following a top-level `END`, with calls before or after other
definitions. Nested calls and recursion are represented by pseudocode custom
blocks. Each call evaluates its arguments once, from left to right, before
entering the callee; numeric BBC comparison results retain their `-1/0` values.

```basic
REM @bw device arduino-uno
REM @bw pin led D13 output
PROCpinMode(13,"output")
PROCpulse(0.0015)
PROCpulse(0.0025)
PRINT FNmillis
END
DEF PROCpulse(seconds)
PROCdigitalWrite(13,1)
IF seconds<0 OR seconds>2147483.647 THEN ERROR 204,"CrispBASIC wait seconds outside 0..2147483.647"
PROCdelay(INT(seconds*1000+0.5))
PROCdigitalWrite(13,0)
ENDPROC
```

This program advances the simulation by 2 ms and then 3 ms. The reader admits
computed waits only when the exact seconds range guard and integer rounding
above are adjacent; the forward generator recreates that guard and rounding.
Arbitrary computed `PROCdelay` calls remain refused. Literal integer-millisecond
delays from 0 through 2147483647 remain supported.

Procedure names and parameters must be lowercase, unsuffixed numeric scalars.
Parameters are read-only. Assignment to a parameter, `LOCAL`, `BYREF`, arrays,
strings, duplicate definitions, nested definitions, malformed calls and early
`ENDPROC` refuse the complete conversion. BBC parameters use dynamic scope;
a parameter name read outside a procedure that declares it is refused instead
of silently turning a caller's local value into a global. Separate procedures
may declare the same parameter spelling because each receives a distinct
pseudocode argument name.

All existing statement and expression restrictions also apply within a
procedure. In particular, pin setup remains a static main-program prelude,
and unqualified hardware APIs remain refused.

## Verification

The focused source and CLI boundary suite is:

```sh
node --test test/crispbasic-*.test.mjs test/basic-sweep.test.mjs test/basic-linemap.test.mjs test/basic-trace.test.mjs
```

Brickwright adds real-interpreter qualification of original and regenerated
programs, comparing output bytes and complete ordered GPIO traces. Source
acceptance by itself does not establish execution parity on a new backend.
