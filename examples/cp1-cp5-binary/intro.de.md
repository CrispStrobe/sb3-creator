---
level: foundation
age: 11+
prereqs: [cp1-switch-input, cp1-blink]
teaches: [binary-numbers, cp1-input, cp1-output, polling, output-initialization]
---
## Acht Schalter, ein Byte

Dieser Versuchsaufbau nach dem Vorbild des CP5 verbindet acht gewöhnliche Schalter mit CP1-Port 1 und acht LEDs über einen Darlington-Treiber mit Port 2. Schalter, Pull-up-Widerstände, Treiber, LED-Vorwiderstände und Leitungen sind bearbeitbare Schaltungsbauteile. Das Monitor-ROM führt das Lernprogramm auf demselben 8049 aus, der diese Eingangsspannungen liest und den Ausgangsport beschreibt.

Jeder Schalter schließt einen Weg nach Masse. **Geschlossen bedeutet 0; offen bedeutet 1.** Ein Pull-up mit 10 kΩ stellt bei offenem Schalter einen definierten hohen Pegel her. Ein hoher Ausgang schaltet seinen Treiberkanal und seine LED ein. Jede LED besitzt einen eigenen Vorwiderstand mit 1 kΩ.

Die Kanalnummern beginnen bei 1, die Schaltungsanschlüsse bei 0:

| Schalter und LED | Eingangsanschluss | Ausgangsanschluss | Wert bei offenem Schalter/leuchtender LED |
| --- | --- | --- | --- |
| 1 | P1.0 | P2.0 | 1 |
| 2 | P1.1 | P2.1 | 2 |
| 3 | P1.2 | P2.2 | 4 |
| 4 | P1.3 | P2.3 | 8 |
| 5 | P1.4 | P2.4 | 16 |
| 6 | P1.5 | P2.5 | 32 |
| 7 | P1.6 | P2.6 | 64 |
| 8 | P1.7 | P2.7 | 128 |

## Mit einem bewusst gesetzten Ausgangszustand beginnen

1. Importiere ein eigenes kompatibles CP1-Monitor-ROM mit 2048 Byte. Lass die CPU mit **CPU ausführen** bis zur stabilen Bereitschaftsanzeige laufen. Die originale CP5-Anleitung beschreibt, dass nach dem Monitorstart alle LEDs leuchten, weil der Computer seine Ausgänge auf 1 setzt. Das beschreibt den Firmwarestart, nicht jeden einzelnen Resetzeitpunkt oder ein unbekanntes ROM.
2. Pausiere die CPU und lade `program.cp1`. Setze die CPU ohne Zurücksetzen fort: Die Monitorinitialisierung kann den Lernprogrammspeicher löschen. Gib auf der Originaltastatur **0, 0, 0, PC, RUN** ein.
3. Das Programm schreibt zunächst null auf den gesamten Ausgangsport und fordert eine Wartezeit von 200 ms an. In der gelieferten Schaltung sind anfangs alle Schalter geschlossen. Die wiederholten Abfragen halten deshalb alle LEDs aus und zeigen `A00.000` an.
4. Öffne Schalter 1, 3, 6 und 8. Sage `1 + 4 + 32 + 128 = 165` voraus. Nach der nächsten Abfrage leuchten LEDs 1, 3, 6 und 8, und die Anzeige zeigt `A00.165`. Zelle 32 enthält `00.165`, das zuletzt gelesene Byte.
5. Öffne nur Schalter 8 und danach alle Schalter. Sage vor dem Ablesen 128 und 255 voraus. Lies die LED-Reihe nach Kanalnummern; bei geschriebenen Binärzahlen steht Bit 7 üblicherweise links. Deshalb lautet 165 binär `10100101`.

## Den Signalweg im Programm verfolgen

`P1E 0` liest alle acht Eingänge. `ABS observed` speichert den Wert in Zelle 32. `P2A 0` gibt dasselbe Byte auf allen acht Ausgängen aus, und `ANZ` lässt es vom Monitor anzeigen. Die Schleife fordert vor der nächsten Abfrage eine Wartezeit von 100 ms an. Befehlsausführung und Anzeigeabtastung benötigen zusätzliche Zeit; ein exakt 100 ms langer Abfragezyklus wird deshalb nicht behauptet.

Pausiere die CPU, nachdem die LEDs einen stabilen Zustand erreicht haben, und ändere einen Schalter. Seine berechnete Eingangsspannung kann sich ändern. CPU, gespeicherter Messwert und Ausgangslatch behalten jedoch ihren vorherigen Zustand. Setze die CPU fort, damit die Firmware den neuen Eingangswert auf den Ausgang übertragen kann. **STP** auf der CP1-Tastatur hält das Lernprogramm an, während der Monitor weiterläuft. **CPU pausieren** hält die Prozessorausführung an.

## Was dieser Aufbau darstellt

Das originale CP5 besaß Transistorausgänge. Dieses Beispiel verwendet den vorhandenen simulierten Darlington-Baustein mit acht Kanälen und eine LED-Versorgung mit 5 V, um dieselbe Beziehung zwischen Eingang, Byte und Ausgang zu zeigen. Es ist eine neu entwickelte Lernschaltung, kein Nachbau der CP5-Transistorstufen oder ihrer Belastbarkeit. Treiber und CP1-Anschlüsse verwenden die dokumentierten elektrischen Näherungen des Simulators. Ein historisches Monitor-ROM oder ein Programm aus der Anleitung ist nicht enthalten.

Schließe den Lernschritt ab, nachdem du Eingangsspannungen, Dezimalanzeige und LED-Ströme selbst verglichen hast. Das Laden des Beispiels oder das Anklicken eines Schalters allein beweist noch keine Firmwareausführung.
