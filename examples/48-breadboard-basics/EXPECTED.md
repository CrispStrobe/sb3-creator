# 48-breadboard-basics -- expected behaviour

## Circuit

Same as 47-battery-led: 9 V battery -> 1 kOhm resistor -> red LED (Vf = 2.0 V) -> battery negative.
This example adds breadboard layout guidance to teach physical placement.

## Breadboard layout

A standard half-size breadboard has two power rails (+ and -) along each edge
and columns a-e / f-j with rows 1-30. Each row of five holes (a-e or f-j)
is connected internally.

### Placement

1. **Battery positive** wire to the **+ power rail**
2. **Battery negative** wire to the **- power rail**
3. **Resistor** (1 kOhm): one leg in **a5**, other leg in **a10**
   - Rows 5 and 10 are now connected to each resistor leg
4. **Jumper wire** from **+ rail** to **b5**
   - This connects battery positive through the resistor
5. **LED anode** (long leg) in **b10**
   - Connected to the resistor's other leg via row 10
6. **LED cathode** (short leg, flat side) in **b11**
7. **Jumper wire** from **b11** to the **- rail**
   - This completes the circuit back to battery negative

### Current path

+ rail -> jumper -> a5/b5 (row 5) -> resistor -> a10/b10 (row 10) -> LED anode -> LED cathode -> b11 (row 11) -> jumper -> - rail

## Observable behaviour

- **Circuit current:** (9.0 - 2.0) / 1000 = 7.0 mA
- **Voltage across resistor:** 7.0 V
- **Voltage across LED:** 2.0 V
- **LED state:** always ON

## What this verifies

1. Breadboard row connectivity (five holes per row are joined)
2. Power rails run the full length of the board
3. Translating a schematic into a physical breadboard layout
4. The LED orientation matters: anode toward positive, cathode toward negative
