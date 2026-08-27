# Ein Stapel — das, woraus CALL und RET gemacht sind

Dasselbe 16x4-RAM wie in pc102, nur liefert die Adresse jetzt ein 74LS193 statt des Programmzählers — und genau darum geht es: Ein 74LS161 zählt nur in eine Richtung, ein daraus gebauter Zeiger könnte ablegen und nie zurückholen. Ablegen heißt: Schalter stellen, /WE pulsen (Wert nach [SP]), dann PUSH pulsen (Zeiger weiter). Zurückholen heißt: erst POP pulsen (Zeiger zurück), DANN lesen. Diese Reihenfolge ist die ganze Disziplin — wer vor dem Zurücksetzen liest, bekommt die leere Zelle ÜBER dem Stapel und hält das für zerstörten Speicher, obwohl nur ein Zähler einen Moment zu spät getaktet wurde. Lege drei Zahlen ab und hole sie zurück: Sie kommen in umgekehrter Reihenfolge — die Eigenschaft, die eine Rücksprungadresse einen verschachtelten Aufruf überleben lässt. Beachte die Taster: Die beiden Takteingänge des 193 ruhen HIGH, hängen also an Pull-ups, und gezählt wird beim LOSLASSEN. Verdrahtet man sie andersherum, bewegt sich der Zeiger nie und der Stapel überschreibt still immer dieselbe Zelle.

**Vermittelt:** LIFO aus RAM und Auf-/Ab-Zähler; warum POP erst zurücksetzen und dann lesen muss

## Was zu tun ist

Stelle die DIP-Schalter und beobachte die Ausgänge. Der Aufbau braucht 3 Steckbretter — echter Logik gehen die Löcher schnell aus.

Jeder Chip bekommt +5 V und GND — ein IC ohne Versorgung tut nichts, und ein offener Eingang tut Schlimmeres: er liest, was der Raum gerade macht. Genau das verhindern die 10-kΩ-Pulldowns.

## Was du sehen solltest

| action | what happens |
|---|---|
| push 3, 7, 12 | SP goes 0 -> 3 |
| pop | 12 |
| pop | 7 |
| pop | 3 |
| 16 pushes | SP wraps to 0 — no depth check |
| clocks | idle HIGH, count on release |

## Was du brauchst

| qty | part |
|---|---|
| 1 | 74HC04 Hex NOT |
| 1 | 74LS189 16x4 RAM |
| 1 | 74ls193 |
| 2 | 4-way DIP Switch (SPST) |
| 4 | LED 2V, green |
| 4 | LED 2V, red |
| 8 | Resistor 10kΩ |
| 8 | Resistor 330Ω |

3 integrierte Schaltkreis(e), 3 Steckbrett(er), 5 V.
