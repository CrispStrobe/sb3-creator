# Ein Widerstand wird heiß: die Leistungsgrenze ist eine Kurve

Jeder Widerstand macht aus elektrischer Leistung Wärme. Wie heiß er wird, hängt von der Leistung ab, Spannung mal Strom, nicht von der Spannung allein. Zwei Widerstände mit je einem Thermometer zeigen es.

**Vermittelt:** elektrische Leistung, Erwärmung, Belastbarkeit, I-U-Gerade und Leistungshyperbel

## Was zu tun ist

Klick auf **Sim**. Lies Spannungs- und Strommesser ab und multipliziere. Dreh **VOLTS** auf, bis der Spannungsmesser 4 V zeigt, und warte ein paar Sekunden. Schieb dann **SELECT** auf den 100-Ω-Widerstand und warte wieder.

## Was du sehen solltest

- 47 Ω bei 3,4 V: 72 mA, etwa ein Viertelwatt; die HOT-LED bleibt dunkel.
- 47 Ω bei 4 V: 0,34 W, er wird heiß (etwa 93 °C), seine HOT-LED leuchtet.
- 100 Ω bei denselben 4 V: nur 40 mA, 0,16 W; er bleibt kühl genug.

## Warum es funktioniert

Leistung ist Spannung mal Strom, und bei festem Widerstand wächst auch der Strom mit der Spannung: P = U²/R. Ein Viertelwatt-Widerstand darf 0,25 W verheizen; im Diagramm Strom gegen Spannung ist das eine Kurve, I = 0,25/U. Die Gerade jedes Widerstands schneidet diese Kurve bei einer anderen Spannung: etwa 3,4 V für 47 Ω, 5 V für 100 Ω. Die Thermometer sind Transistoren, deren Basis-Emitter-Spannung pro Grad um 2 mV sinkt.
