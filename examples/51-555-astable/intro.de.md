---
level: advanced
age: 16+
prereqs: [43-rc-timing]
teaches: [555-timer, astable, oscillator]
---
## Was du siehst
Ein 555-Timer-IC in astabiler Beschaltung — er oszilliert kontinuierlich ohne externen Trigger und laesst eine LED mit einer Rate blinken, die durch zwei Widerstaende und einen Kondensator bestimmt wird. Kein Mikrocontroller, kein Code — der 555 erzeugt die Rechteckwelle ganz allein.

## Probier das
1. Starte die Simulation und beobachte, wie die LED in gleichmaessigem Takt blinkt.
2. Aendere den Zeitkondensator auf einen groesseren Wert und beobachte, wie die Blinkrate sinkt.
3. Veraendere das Verhaeltnis der beiden Zeitwiderstaende und beachte, wie sich das Tastverhaeltnis aendert — Ein- und Auszeit sind nicht mehr gleich.

## Was passiert hier
Im astabilen Modus laedt der 555 den Zeitkondensator ueber zwei Widerstaende (R1 und R2) auf 2/3 VCC, entlaedt ihn dann nur ueber R2 auf 1/3 VCC und wiederholt das. Der Ausgang wechselt an jedem Schwellwert zwischen High und Low und erzeugt eine Rechteckwelle. Die Frequenz ist ungefaehr f = 1,44 / ((R1 + 2*R2) * C). Da Lade- und Entladepfad verschieden sind, ist das Tastverhaeltnis nicht exakt 50%, es sei denn, man fuegt eine Diode hinzu, um R1 beim Laden zu umgehen. Diese einfache Schaltung wurde seit 1972 in Millionen von Produkten eingesetzt.

## Warum das wichtig ist
Der 555-Timer ist einer der meistproduzierten ICs der Geschichte. Er lehrt Oszillatordesign, RC-Timing und Schwellwertkomparatoren in einem einzigen Bauteil. Den astabilen Modus zu verstehen ist der Einstieg in Taktgeber, Tongeneratoren und PWM-Steuerungen ohne Mikrocontroller.

## Weiter geht's
- [43-rc-timing](../43-rc-timing) — wiederhole die RC-Ladekurve, auf die der 555 intern angewiesen ist.
- [24-pwm-fade](../24-pwm-fade) — vergleiche das Hardware-PWM des 555 mit dem Software-PWM eines Mikrocontrollers.
- Experiment: Berechne die Widerstands- und Kondensatorwerte fuer einen hoerbaren 1-kHz-Ton, baue die Schaltung und schliesse einen kleinen Lautsprecher statt der LED an.
