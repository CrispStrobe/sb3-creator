---
level: beginner
age: 8+
prereqs: []
teaches: [led, resistor, direct-wiring]
---
## Was du siehst
Eine rote LED und ein 1-kΩ-Widerstand, direkt an eine 9-V-Batterie angeschlossen — ohne Steckbrett. Dieselbe Schaltung wie pc01, aber mit Punkt-zu-Punkt-Verbindungen, die du von Bauteil zu Bauteil verfolgen kannst.

## Probier das
1. Klick auf **Sim** und beobachte, wie die LED leuchtet.
2. Verfolge den Drahtweg: Batterie Plus → Widerstand → LED → Batterie Minus. Jedes Elektron nimmt denselben Weg.
3. Ändere den Widerstand auf 220 Ω und sieh, wie viel heller die LED wird.

## Was passiert hier
Das ist die einfachste LED-Schaltung, die es gibt. Der 1-kΩ-Widerstand begrenzt den Strom auf etwa 7 mA — sicher für die LED, aber dunkler als mit einem kleineren Widerstand. Die LED fällt etwa 2 V ab, die restlichen 7 V liegen am Widerstand: I = 7 V / 1 kΩ = 7 mA.

## Warum das wichtig ist
Direkte Verdrahtung ist der Anfang jedes echten Prototyps, bevor ein Steckbrett ins Spiel kommt. Einen Schaltplan als Kette von Verbindungen lesen zu können — nicht als Layout — ist die erste Fertigkeit der Elektronik.

## Weiter geht's
- [pc01-led-resistor](../pc01-led-resistor) — dieselbe Schaltung auf einem Steckbrett.
- [pc10-direct-series](../pc10-direct-series) — füge eine zweite LED in Reihe hinzu.
- Experiment: Was ist der größte Widerstand, bei dem die LED noch sichtbar leuchtet?
