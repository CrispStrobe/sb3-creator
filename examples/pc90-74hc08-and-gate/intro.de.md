# UND-Gatter auf dem Steckbrett (74HC08)

Zwei DIP-Schalter an ein 74HC08-UND-Gatter, eine LED am Ausgang. Die LED leuchtet nur, wenn BEIDE Schalter geschlossen sind — die Wahrheitstabelle zum Anfassen. Beachte die 10-kΩ-Pulldowns: ein offener Schalter muss auf ein echtes LOW gezogen werden, sonst hängt ein CMOS-Eingang einfach in der Luft.

**Vermittelt:** UND-Wahrheitstabelle, Pulldown-Widerstände, IC-Versorgungspins

## Was zu tun ist

Stelle die DIP-Schalter und beobachte die Ausgänge. Alles sitzt auf einem Steckbrett.

Jeder Chip bekommt +5 V und GND — ein IC ohne Versorgung tut nichts, und ein offener Eingang tut Schlimmeres: er liest, was der Raum gerade macht. Genau das verhindern die 10-kΩ-Pulldowns.

## Was du sehen solltest

| A | B | LED |
|---|---|---|
| 0 | 0 | off |
| 1 | 0 | off |
| 0 | 1 | off |
| 1 | 1 | ON |
