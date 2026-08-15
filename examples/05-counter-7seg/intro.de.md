---
level: beginner
age: 8+
prereqs: [01-blink]
teaches: [button-input, counting, debounce]
---
## Was du siehst
Bei jedem Tastendruck auf P3.2 erhöht sich ein Zähler um eins und die LED blinkt entsprechend oft. Der MCU liest einen digitalen Eingang, zählt die Tastendrücke und nutzt den Zählerstand zur Steuerung der Ausgabe.

## Probier das
1. Starte das Programm und drücke die Taste einmal — die LED blinkt einmal.
2. Drücke noch dreimal und beobachte, wie die LED beim letzten Druck viermal blinkt.
3. Drücke schnell hintereinander und beachte, dass jeder Druck genau einmal gezählt wird — das ist Entprellung.

## Was passiert hier
Die Taste verbindet P3.2 über einen Pull-Down-Widerstand mit Masse. Beim Drücken liest der Pin LOW. Das Programm erkennt einen HIGH-zu-LOW-Übergang, wartet eine kurze Entprellzeit (ca. 20 ms), bis das mechanische Prellen abgeklungen ist, und erhöht dann den Zähler. Danach blinkt die LED so oft, wie der Zähler angibt. Ohne Entprellzeit könnte ein einzelner Druck als zwei oder drei Drücke registriert werden, weil die Metallkontakte im Taster mehrfach prellen, bevor sie zur Ruhe kommen.

## Warum das wichtig ist
Einen Taster auszulesen und Ereignisse zu zählen, ist grundlegend für jedes interaktive Gerät — Aufzüge, Automaten, Fernbedienungen. Entprellung ist ein Problem, dem jeder Ingenieur begegnet, und es früh zu lernen verhindert mysteriöse Doppelzählungen später.

## Weiter geht's
- [11-toggle-button](../11-toggle-button) — mit einer Taste die LED ein- und ausschalten statt zu zählen.
- [01-blink](../01-blink) — das einfachere Nur-Ausgabe-Programm nochmal ansehen, wenn der Tastereingang komplex wirkt.
- Experiment: Füge einen Reset hinzu — wenn die Taste länger als 2 Sekunden gehalten wird, setze den Zähler auf null zurück.
