# Elektronischer Strommesser bis 1 A mit Überlast-Ton

Um einen Strom zu messen, kannst du ihn durch einen winzigen Widerstand schicken und die Spannung daran messen. Bei 0,1 Ω ist das nur ein Zehntel Volt pro Ampere, deshalb verstärkt ein Operationsverstärker es zehnfach für das Messgerät. Ein zweiter schlägt über 1 A Alarm.

**Vermittelt:** Messwiderstand (Shunt), Strom mit einem Spannungsmesser messen, Verstärken, Überlastalarm

## Was zu tun ist

Klick auf **Sim**. Die Lampe (**LAMP**) ist an. Schalte **HEATER** dazu, dann **SHORT**. Schalte sie wieder aus.

## Was du sehen solltest

- Lampe: 0,1 am Messgerät (0,1 A).
- Lampe und Heizung: 0,7 A.
- Mit dem Kurzschluss: Der Zeiger schlägt an (1,8 A), und der Lautsprecher gibt einen Alarmton.

## Warum es funktioniert

Der Strom aller Verbraucher fließt durch den 0,1-Ω-Shunt und erzeugt dort 0,1 V pro Ampere (U = R·I). Der Operationsverstärker verstärkt das zehnfach, das Messgerät zeigt also 1 V pro Ampere. Ein weiterer vergleicht den Messwert mit 0,98 V; darüber lässt er einen dritten schwingen, den er sonst über eine Diode festhält.
