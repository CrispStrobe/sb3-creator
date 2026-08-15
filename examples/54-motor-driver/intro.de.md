---
level: advanced
age: 16+
prereqs: [10-motor-speed]
teaches: [h-bridge, bidirectional-drive, motor-control]
---
## Was du siehst
Ein Gleichstrommotor, angeschlossen ueber einen L293D-H-Bruecken-Treiber-IC. Der MCU steuert sowohl die Geschwindigkeit (per PWM am Enable-Pin) als auch die Richtung (ueber zwei Logik-Pins). Der Motor kann vorwaerts, rueckwaerts oder angehalten werden — alles programmgesteuert.

## Probier das
1. Starte die Simulation und beobachte, wie der Motor in eine Richtung dreht.
2. Wechsle die Richtungs-Pins und beobachte, wie der Motor die Drehrichtung umkehrt.
3. Reduziere das PWM-Tastverhaeltnis am Enable-Pin und beobachte, wie der Motor langsamer wird.

## Was passiert hier
Eine H-Bruecke ist eine Schaltung mit vier Schaltern, die in H-Form um den Motor angeordnet sind. Durch Schliessen diagonaler Paare fliesst Strom in die eine oder andere Richtung durch den Motor. Der L293D verpackt das in einem einzigen IC mit eingebauten Freilaufdioden, die vor den Spannungsspitzen schuetzen, die Motoren beim Schalten erzeugen. Der Enable-Pin akzeptiert PWM zur Steuerung der mittleren Spannung am Motor, was dessen Geschwindigkeit steuert. Zwei Logikeingaenge waehlen die Richtung: einer High und einer Low fuer vorwaerts, umgekehrt fuer rueckwaerts, beide Low fuer Stopp.

## Warum das wichtig ist
Gleichstrommotoren brauchen mehr Strom, als jeder MCU-Pin liefern kann, und sie muessen sich fuer die meisten Anwendungen in beide Richtungen drehen — Raeder, Foerderbaender, Roboterarme. Die H-Bruecke ist die Standardloesung, und der L293D ist die klassische anfaengerfreundliche Version davon.

## Weiter geht's
- [53-servo-sweep](../53-servo-sweep) — vergleiche die Drehzahlsteuerung eines Gleichstrommotors mit der Positionssteuerung eines Servos.
- [10-motor-speed](../10-motor-speed) — wiederhole die einseitige Motordrehzahlsteuerung, die dieses Beispiel erweitert.
- Experiment: Programmiere eine Sequenz, die den Motor 2 Sekunden vorwaerts dreht, 1 Sekunde stoppt, 2 Sekunden rueckwaerts dreht und wiederholt — ein einfacher Hin-und-her-Roboteranthieb.
