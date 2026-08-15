---
level: advanced
age: 14+
prereqs: [pc06-rc-charge]
teaches: [555-timer, monostable, pulse-generation]
---
## Was du siehst
Ein 555-Timer im Monoflop-Modus (Einmal-Impuls). Drücken des Trigger-Tasters startet einen einzelnen zeitgesteuerten Impuls — die LED leuchtet für eine durch Widerstand und Kondensator festgelegte Dauer, dann schaltet sie sich automatisch ab.

## Probier das
1. Klick auf **Sim** — die LED ist dunkel (Timer im Ruhezustand, Ausgang Low).
2. Drücke den Trigger-Taster. Die LED leuchtet auf und der Kondensator beginnt sich zu laden.
3. Nach der Impulsdauer (t ≈ 1,1 × R × C) erlischt die LED und der Timer setzt sich zurück. Der Kondensator entlädt sich über den internen Transistor des Timers.

## Was passiert hier
Der 555-Timer nutzt einen internen Komparator, um die Kondensatorspannung zu beobachten. Beim Triggern setzt er seinen Ausgang auf High und lässt den Kondensator über den Zeitgeberwiderstand laden. Wenn der Kondensator 2/3 von VCC erreicht, kippt der Komparator, der Ausgang geht auf Low, und der interne Entladetransistor zieht den Kondensator auf Masse. Die Impulsdauer beträgt t = 1,1 × R × C, unabhängig von der Versorgungsspannung.

## Warum das wichtig ist
Der 555-Timer ist einer der meistverwendeten ICs aller Zeiten — Milliarden wurden seit 1972 produziert. Im Monoflop-Modus erzeugt er präzise Zeitverzögerungen für Entprellung, Impulsverlängerung und das Triggern anderer Schaltungen. Seine RC-Zeitgebung zu verstehen ist der Schlüssel zu jeder Konfiguration.

## Weiter geht's
- [pc06-rc-charge](../pc06-rc-charge) — die RC-Ladekurve, die die Zeitgebung antreibt.
- [pc27-timer-pulse](../pc27-timer-pulse) — eine andere Timer-Impulsschaltung.
- Experiment: Verdopple den Kondensatorwert und überprüfe, dass sich die Impulsdauer verdoppelt.
