# Den Wind fühlen: ein selbstbeheizter Sensor

Eine kleine Heizung hält einen Temperatursensor etwas wärmer als den Raum. Streicht Luft vorbei, trägt sie Wärme fort und der Sensor kühlt ab, obwohl die Luft selbst nicht kälter ist. Wer diese Abkühlung misst, misst den Wind.

**Vermittelt:** Hitzdraht-Anemometer, thermische Kopplung, Brückenschaltung, Komparator, Thermostat

## Was zu tun ist

Klick auf **Sim** und warte etwa zehn Sekunden, bis sich der Sensor erwärmt hat und die rote LED ausgeht. Stell dann den Luftstrom auf 2 m/s. Stell ihn wieder auf 0 und erhöhe die Raumtemperatur auf 32 °C.

## Was du sehen solltest

- Ruhige Luft: Instrument nahe null, kein Alarm.
- Luftstrom: Das Instrument steigt, die LED für Zugluft leuchtet.
- Warmer Raum: Der Lüfter schaltet sich ein.

## Warum es funktioniert

Heizung und Thermistor sitzen zusammen. In ruhiger Luft stellt sich ein Gleichgewicht zwischen zugeführter und an die Luft abgegebener Wärme ein. Bewegte Luft nimmt die Wärme schneller weg, also stellt sich das Gleichgewicht tiefer ein. Der Widerstand des Thermistors folgt seiner Temperatur, die Brücke macht daraus eine Spannung, und die Komparatoren entscheiden, wann es zu kühl ist (Zugluft) oder zu warm (Lüfter an). Luftmassenmesser im Auto arbeiten mit derselben Idee.
