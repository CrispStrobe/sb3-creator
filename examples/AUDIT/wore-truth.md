# WORE Truth Reconciliation Ledger

Suite reconciliation after dialect C `long` variables, button polarity,
PB7 freed, gallery gate fix, and pc76-multimeter landing.

## Status after checkpoint 1 (ba214ec)

| class | count | status |
|---|---|---|
| A: devices list stale | 19→0 | **FIXED** (update-example-devices + batch regen) |
| B: referee trace mismatch | 22 | OPEN — see below |
| C: pc85 orphan wire | 1→0 | **FIXED** (removed wire to pruned resistor_6) |
| D: index.json validity | 1 | OPEN — downstream of new bench entries |
| E: retarget convention | 1 | OPEN — diagnosing |
| **test:fast** | **1070 pass, 0 fail** | **GREEN** |
| **npm test (full)** | **26 reds** | was 39 |

## Class B: referee trace mismatches (22 remaining)

### 55-oled-hello (11 devices)
All 11 device flavors fail referee trace. The OLED I2C example's traces
were generated before the dialect `long` (32-bit int) change. The computed
values differ because variable arithmetic now wraps differently.
**Owner: coordinator** — regenerate traces after dialect stabilizes.

### 53-servo-sweep (9 devices)
All device flavors fail referee trace. Same cause: the servo PWM timing
values are affected by the int-width change.
**Owner: coordinator** — regenerate traces.

### 08-led-chaser-595 (1: cross-device identity)
Traces differ across devices. The shift register pattern depends on
timing that varies per device clock. Legitimate device difference, not
a bug — but the amplification test expects identity.
**Owner: coordinator** — either accept device-specific traces or
adjust the amplification expectation.

## Class D: index.json validity (1)

`not ok 977 - gallery: index.json is valid and covers every example`
New bench entries from the batch generation need the seat+index steps
which require Node ≥22 (`fs.globSync`). The benches are generated but
not enrolled in the index.
**Owner: coordinator** — run seat+index on a Node 22 environment, or
polyfill `fs.globSync` for Node 20.

## Class E: retarget convention (1)

`not ok 1048 - retarget: more pins than the convention offers is refused`
A retarget test expects a refusal when a program uses more pins than a
target device offers. Diagnosing whether this is a test expectation
issue or an actual retarget bug.
**Owner: coordinator** — diagnosing.
