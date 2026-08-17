# Matrix Keypad Retarget — Design

## Problem

The 70-calculator declares 17 direct input pins (10 digits + 4 ops + exe/clr/ac).
Constrained targets have too few GPIOs:
- eater6502: 7 inputs (PB0-PB6), minus SDA/SCL leaves 6 output + 5 input
- z80: 8 inputs (IN0-IN7), single port

A 4×5 matrix keypad gives 20 keys from 9 pins (4 row outputs + 5 col inputs).

## Design: matrix pool in RETARGET_POOLS

Add a `matrix` entry to RETARGET_POOLS for constrained targets:

```javascript
eater6502: {
    digital: ['PA2', ...],       // remaining outputs after SDA/SCL
    analog: [],
    input: ['PB0', ...],         // direct input pins
    pwm: [],
    matrix: {                    // NEW: virtual input pool via scan
        rows: ['PA2', 'PA3', 'PA4', 'PA5'],  // output pins driven one at a time
        cols: ['PB0', 'PB1', 'PB2', 'PB3'],  // input pins read during scan
    },
    ledActiveLow: false,
}
```

## Retarget algorithm change

In `retargetPseudocode()`, when the flat input pool is exhausted:

1. Count how many input pins the program needs.
2. If `pools.matrix` exists and R×C >= needed, use the matrix.
3. Assign each input pin a matrix coordinate: `(row_idx, col_idx)`.
4. In the retargeted pseudocode, replace `PIN bN = GPx INPUT` with
   `PIN bN = MATRIX(row,col) INPUT` (a new pin-kind the emitter recognizes).
5. The emitter generates a `bw_key_scan()` function that drives each row LOW
   (active scan), reads the columns, and returns a bitmask.
6. Each `read bN` in the program becomes `bw_key_read(N)` which calls the
   scan and extracts the correct bit.

## Emitted C (6502 example)

```c
/* Matrix keypad: 4 rows (PA2-PA5) × 4 cols (PB0-PB3) = 16 keys. */
static unsigned char _key_state[4];  /* one byte per row */

static void bw_key_scan(void) {
    unsigned char r;
    for (r = 0; r < 4; r++) {
        /* Drive row r LOW, all others HIGH (active-low scan). */
        BW_VIA_ORA = (BW_VIA_ORA | 0x3C) & ~(1u << (r + 2));
        /* Small delay for settling. */
        { unsigned char d; for (d = 0; d < 4; d++) ; }
        /* Read columns (active-low: pressed = 0). */
        _key_state[r] = ~BW_VIA_IRB & 0x0F;
    }
    BW_VIA_ORA |= 0x3C;  /* all rows HIGH (idle) */
}

static unsigned char bw_key_read(unsigned char idx) {
    unsigned char row = idx >> 2;   /* idx / cols */
    unsigned char col = idx & 0x03; /* idx % cols */
    bw_key_scan();
    return (_key_state[row] >> col) & 1;
}
```

## Slice for this session

**Don't transform the pseudocode at all.** Instead:
1. Expand the eater6502 `input` pool to include matrix-virtual pins (MK0-MK19).
2. The retarget maps each direct input pin to an MK slot.
3. In generateC, detect `MK` pins and emit the matrix scan driver.
4. `read bN` → `bw_key_read(N)` where N is the matrix index.

This is the minimum that makes `retargetPseudocode(calculator, 'eater6502')` 
return `ok: true` and the generated C compile under cc65.

## Future work (not this session)

- Z80 matrix keypad (same pattern, OUT latch rows + IN buffer cols)
- Configurable matrix dimensions per target
- Matrix keypad device model in bw-board for simulation
