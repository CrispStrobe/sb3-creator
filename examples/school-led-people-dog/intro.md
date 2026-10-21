# AA resistor people and dog

This is the user's explicitly rewired AA variation, not the original 9 V PCB wiring. [Original assembly manual](https://www.winklerschulbedarf.com/Documents/Anleitungen_Werkpackungen/PDF_Ger/102170.pdf).

Supply: 4.5 V, fourteen 220 Ω resistors and R5=470 Ω. All eight feet return to ground. Supply feeds the hand node between R5 and R9. R9 supplies both the right person and the dog; its current is their sum. The dog's front legs are parallel with the back plus parallel rear legs. R4 and the tail diode each have one open terminal and must carry zero current.

With constant LED drops of 2.0 V red and 2.1 V green, hand calculation gives about 3.13, 3.26 and 3.22 mA. The declared vf engine model includes a knee and dynamic resistance, so those simulated numbers differ. Do not compare that model to an unrelated SPICE diode card and call the difference a solver failure. Real LED types, supply state and perceived brightness also differ.

Check zero current at R4 and the open tail, equal parallel-leg currents and shared-arm KCL. This DC circuit produces no sustained audio.
