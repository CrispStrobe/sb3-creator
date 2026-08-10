# Beispiele — deine ersten Schaltungen und Programme

Diese Galerie enthält **74 Beispiele zum Sofort-Öffnen**: 20 reine Schaltungen
ohne Mikrocontroller und 54 Programme, die auf einem simulierten STC12-Chip laufen.
Jedes Beispiel hat eine Schaltung zum Ansehen, Zahlen zum Prüfen und etwas, das du
ändern kannst, um den Unterschied zu sehen.

## Reine Schaltungen — fang hier an

Kein Programmieren nötig. Schaltung öffnen, und sie funktioniert.

| # | was du siehst | was es lehrt |
|---|---|---|
| **pc01** | Eine LED leuchtet | Ein Widerstand begrenzt den Strom, damit die LED überlebt |
| **pc09** | Dieselbe LED, kein Steckbrett | Bauteile kann man auch direkt verdrahten — ein Steckbrett ist nur bequem |
| **pc02** | Zwei Widerstände, keine LED | Spannung teilt sich im Verhältnis der Widerstände |
| **pc04** | Zwei LEDs nebeneinander | Parallele Pfade teilen sich den Strom |
| **pc17** | Drei LEDs, drei Helligkeiten | Mehr Widerstand = weniger Strom = dunklere LED |
| **pc05** | Eine LED, die einen Taster braucht | Ein Transistor verstärkt einen winzigen Basisstrom zu einem großen Kollektorstrom |
| **pc06** | Ein Kondensator lädt sich langsam | Eine RC-Schaltung hat eine Zeitkonstante τ = R × C |
| **pc18** | Eine Zener-Diode begrenzt die Spannung | Eine Zener-Diode hält eine feste Spannung, egal wie die Versorgung aussieht |

**Was du ändern kannst:** Öffne `pc17-current-compare` und ändere den 220-Ω-Widerstand
auf 1000 Ω. Die LED wird dunkler — der Strom sank von 13,6 mA auf 3,0 mA. Das ist
das Ohmsche Gesetz: I = U / R.

## Mikrocontroller-Programme — wenn du die Schaltung verstehst

Diese fügen ein Programm hinzu, das auf dem Chip läuft und die Schaltung steuert.

| # | was es tut | was es lehrt |
|---|---|---|
| **01** | Eine LED blinkt mit 1 Hz | `FOREVER` + `wait` = eine Schleife mit Zeitsteuerung |
| **06** | Zwei LEDs, gegensätzliche Verdrahtung | Active-Low vs Active-High: gleicher Befehl, verschiedene Pegel |
| **14** | Drei LEDs nacheinander | Eine Ampel ist nur drei zeitgesteuerte Ausgänge |
| **05** | Tastendruck zählen | `wait until` + Variablen = auf Eingabe reagieren |
| **07** | Ein Summer wechselt zwei Töne | `set pin to N hz` = eine Frequenz, kein Bit |
| **32** | Eine helle LED, eine dunkle | Der 8051 senkt 20 mA, liefert aber nur 0,23 mA — DIE Lektion |
| **46** | Acht LEDs an einem Port | Jede einzeln ist OK; zusammen nähern sie sich dem 120-mA-Limit des Chips |

**Was du ändern kannst:** Öffne `01-blink` und ändere `wait 0.5 seconds` auf
`wait 0.1 seconds`. Die LED blinkt schneller. Ändere `toggle led1` zu
`turn on led1` gefolgt von `turn off led1` — dasselbe Ergebnis, aber jetzt
siehst du beide Hälften des Zyklus.

## Der Pseudocode-Dialekt

Programme werden in einem Dialekt geschrieben, der sich wie Englisch liest:

```
DEVICE STC12C5A60S2
CLOCK 11059200
PIN led1 = P1.0 OUTPUT ACTIVE LOW

WHEN flag clicked:
  FOREVER:
    turn on led1
    wait 0.5 seconds
    turn off led1
    wait 0.5 seconds
```

Jede Zeile entspricht einem Scratch-Block. `ACTIVE LOW` bedeutet, dass die LED
von VCC über einen Widerstand zum Pin verdrahtet ist — Einschalten treibt den
Pin auf LOW (0), weil der 8051 viel mehr Strom senken als liefern kann.

## Sicherheits-Lektionen

Drei Beispiele zeigen, was auf einer echten Platine schiefgeht:

| # | der Fehler | was der Simulator zeigt |
|---|---|---|
| **31** | LED ohne Vorwiderstand | Überstrom — die LED würde durchbrennen |
| **32** | LED active-high an einem quasi-bidirektionalen Pin | Fast kein Licht — der Pin liefert nur ~230 µA |
| **09** | Relais direkt am Pin (alte Version) | Das Relais schaltet nicht — der Pin kann es nicht treiben |

Die korrigierte Version steht im selben Beispiel oder in einem Begleiter:
`09-relay-clicker` nutzt jetzt einen TIP120-Darlington-Treiber, so wie man
es tatsächlich bauen würde.

## Dateistruktur

Jedes Beispiel ist ein Verzeichnis mit drei Dateien:

| Datei | was sie enthält |
|---|---|
| `program.bw` | Das Pseudocode-Programm (oder ein Kommentar bei reinen Schaltungen) |
| `circuit.json` | Die Schaltung: Bauteile, Drähte, Steckbrettpositionen |
| `EXPECTED.md` | Was passieren sollte, mit berechneten Werten |

`index.json` listet jedes Beispiel mit englischem und deutschem Titel,
einer Kategorie und einem Schwierigkeitsgrad (1–5).
