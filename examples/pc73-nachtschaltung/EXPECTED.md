# pc73-nachtschaltung — expected behaviour

## Circuit
VCC → 10 kΩ → junction → LDR → GND. Junction → NPN base. VCC → 470 Ω → white LED → NPN collector. NPN emitter → GND.

## Observable behaviour
- **Dark (LDR ≈ 100 kΩ):** V_base = 5 × 100k/(10k+100k) = 4.55 V. Transistor ON. LED ON.
  I_LED ≈ (5 − 2 − 0.2) / 470 ≈ 5.96 mA.
- **Bright (LDR ≈ 1 kΩ):** V_base = 5 × 1k/(10k+1k) = 0.45 V. Below 0.7 V. Transistor OFF. LED OFF.
- The LED is the inverse of the Tagschaltung — dark → LED on.

## What this verifies
1. Swapping LDR and resistor inverts the light response
2. Same components, opposite behaviour — divider position matters
3. Night light turns on automatically in darkness

```assert
# Night circuit: R upper, LDR lower. Dark -> base HIGH -> LED on
net vcc_1.pos V 5.00 +-0.01
```
