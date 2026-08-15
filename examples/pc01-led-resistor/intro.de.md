---
level: beginner
age: 8+
prereqs: []
teaches: [led, resistor, current-limiting]
---
## Was du siehst
Eine rote LED leuchtet, versorgt von einer 5-V-Quelle über einen 220-Ω-Widerstand. Der Widerstand begrenzt den Strom, damit die LED leuchtet, ohne durchzubrennen.

## Probier das
1. Klick auf **Sim**, um die Simulation zu starten, und beobachte, wie die LED angeht.
2. Schau dir die Spannung über der LED an — sie liegt bei etwa 2 V, nicht bei 5 V.
3. Ändere den Widerstand auf 1 kΩ und beobachte, wie die LED dunkler wird.

## Was passiert hier
Eine LED braucht eine bestimmte Spannung, um zu leuchten (bei Rot etwa 2 V). Die restliche Spannung fällt über dem Widerstand ab. Der Strom beträgt ungefähr (5 V − 2 V) / 220 Ω ≈ 13 mA. Ohne den Widerstand wäre der Strom viel zu hoch, und die LED würde in Millisekunden kaputt gehen.

## Warum das wichtig ist
Jede LED-Schaltung braucht einen Vorwiderstand. Ihn zu vergessen ist der häufigste Anfängerfehler — und zerstört die LED sofort.

## Weiter geht's
- [pc03-series-resistors](../pc03-series-resistors) — füge einen zweiten Widerstand in Reihe hinzu und beobachte, wie der Strom sinkt.
- [pc09-direct-led](../pc09-direct-led) — dieselbe Schaltung ohne Steckbrett.
- Experiment: Tausche die rote LED gegen eine mit anderem Vf und sag den neuen Strom vorher, bevor du simulierst.
