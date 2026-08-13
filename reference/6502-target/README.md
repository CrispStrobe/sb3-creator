# The EATER6502 compile target (cc65)

*2026-08-13. Internal contract — English only. These two files are the whole
toolchain story for `DEVICE EATER6502`; the compile service adopts them
verbatim when the 6502 lane opens.*

`generateC` emits freestanding cc65-compatible C for the composable 6502
machine (RAM `$0000-$3FFF`, W65C51 ACIA at `$5000`, W65C22 VIA at `$6000`,
ROM `$8000-$FFFF`, vectors at `$FFFA`, 1 MHz phi2). Build:

```sh
cc65 -t none --cpu 65C02 -O -o prog.s prog.c
ca65 --cpu 65C02 -o prog.o prog.s
ca65 --cpu 65C02 -o crt0.o crt0.s
ld65 -C eater.cfg -o prog.rom crt0.o prog.o none.lib
```

The output is a raw 32 KB ROM image loaded at `$8000` (vectors included).
`scripts/diff-6502.mjs` runs it on bw-board's `M6502Machine` against the
referee.

Hard-won facts, so nobody re-derives them:

- **cc65 `-O` discards a `(void)`-cast volatile read.** The T1 flag-clearing
  read (`(void)BW_VIA_T1CL`) vanished from the object code; IFR6 stayed set
  and `bw_ms` counted scheduler passes — time ran 2.4× fast. The emitter
  routes that read through a `static volatile uint8_t` sink, which is a
  volatile STORE and cannot be dropped. Any future register-read-for-effect
  must do the same.
- **`none.lib` is the right library** (runtime helpers only, no OS), but its
  own `crt0.o` module rides along via the `_exit` chain: satisfy
  `__STACKSTART__` as a weak symbol and do NOT export `_exit` from our crt0
  (duplicate). The `CONDES` FEATURES block feeds `condes.s`.
- **Startup costs ~8 ms at 1 MHz** (zerobss + copydata before `main`); a
  cooperative pass costs real milliseconds, so deadlines re-arm late and lag
  accumulates (~9 ms/s measured). The comparator's `startupMs` and
  `driftPerSecMs` budgets exist for exactly this; order and levels stay
  exact, so a wrong program cannot hide inside them.
- crt0 parks the machine with `STP` (`.byte $db` — ca65's 65C02 CPU model
  has no `stp` mnemonic) if `main` ever returns.

Attribution note: the cfg/crt0 shape follows the standard cc65 custom-target
pattern; VR65C02 (MIT) was the working example consulted.
