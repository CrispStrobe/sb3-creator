# L2 Electrical Audit

Headless engine load of all 236 circuit examples. Checks:
1. Netlist errors (engine rejects the circuit)
2. Dead rails (VCC net < 4V with power on)
3. Display parts with zero wired data terminals
4. Parts without `params` object (regression check)

## Summary

| check | count |
|---|---|
| netlist errors | 8 |
| dead rails | 0 |
| unwired display parts | 0 |
| missing params | 0 |
| engine-solved OK | 214 |
| app-level (skipped) | 14 |
| **total circuits** | **236** |

## Findings (8 examples with issues, most severe first)

### arduino-06-knock
- **netlist-error**: Invalid netlist: |   - Part "piezo" (piezo) has unknown terminal "pos". Expected: a, b |   - Part "piezo" (piezo) has unknown terminal "neg". Expected: a, b

### pc81-led-lauflicht
- **netlist-error**: Invalid netlist: |   - Part "decade_counter_4" (decade_counter) has unknown terminal "a". Expected: clk, rst, en, q0, q1, q2, q3, q4, q5, q6, q7, q8, q9, co |   - Part "decade_counter_4" (decade_counter) has unknown terminal "b". Expected: clk, rst, en, q0, q1, q2, q3, q4, q5, q6, q7, q8, q9, co

### pc82-mini-roulette
- **netlist-error**: Invalid netlist: |   - Part "decade_counter_4" (decade_counter) has unknown terminal "a". Expected: clk, rst, en, q0, q1, q2, q3, q4, q5, q6, q7, q8, q9, co |   - Part "decade_counter_4" (decade_counter) has unknown terminal "b". Expected: clk, rst, en, q0, q1, q2, q3, q4, q5, q6, q7, q8, q9, co

### pc83-gluecksrad
- **netlist-error**: Invalid netlist: |   - Part "decade_counter_4" (decade_counter) has unknown terminal "a". Expected: clk, rst, en, q0, q1, q2, q3, q4, q5, q6, q7, q8, q9, co |   - Part "decade_counter_4" (decade_counter) has unknown terminal "b". Expected: clk, rst, en, q0, q1, q2, q3, q4, q5, q6, q7, q8, q9, co

### pc84-led-herz
- **netlist-error**: Invalid netlist: |   - Part "lm358_3" (lm358) has unknown terminal "a". Expected: vcc, gnd, 1_pos, 1_neg, 1_out, 2_pos, 2_neg, 2_out |   - Part "lm358_3" (lm358) has unknown terminal "b". Expected: vcc, gnd, 1_pos, 1_neg, 1_out, 2_pos, 2_neg, 2_out

### pc85-led-lampe-puls
- **netlist-error**: Invalid netlist: |   - Part "lm358_3" (lm358) has unknown terminal "a". Expected: vcc, gnd, 1_pos, 1_neg, 1_out, 2_pos, 2_neg, 2_out |   - Part "lm358_3" (lm358) has unknown terminal "b". Expected: vcc, gnd, 1_pos, 1_neg, 1_out, 2_pos, 2_neg, 2_out

### pc86-led-sanduhr
- **netlist-error**: Invalid netlist: |   - Part "decade_counter_4" (decade_counter) has unknown terminal "a". Expected: clk, rst, en, q0, q1, q2, q3, q4, q5, q6, q7, q8, q9, co |   - Part "decade_counter_4" (decade_counter) has unknown terminal "b". Expected: clk, rst, en, q0, q1, q2, q3, q4, q5, q6, q7, q8, q9, co

### pc88-lichtorgel
- **netlist-error**: Invalid netlist: |   - Part "sound_module_3" (sound_module) has unknown terminal "a". Expected: vcc, gnd, ao, do |   - Part "sound_module_3" (sound_module) has unknown terminal "b". Expected: vcc, gnd, ao, do

