---
level: beginner
age: 8+
prereqs: [01-blink]
teaches: [button-input, counting, debounce]
---
## Was du siehst
Bei jedem Tastendruck auf P3.2 erhöht sich ein Zähler um eins und die LED blinkt entsprechend oft. Der MCU liest einen digitalen Eingang, zählt die Tastendrücke und nutzt den Zählerstand zur Steuerung der Ausgabe. Dieses Beispiel funktioniert auf allen unterstützten Mikrocontrollern — wähle ein anderes Gerät in der Werkzeugleiste, um die angepasste Schaltung zu sehen.

## Probier das
1. Starte das Programm und drücke die Taste einmal — die LED blinkt einmal.
2. Warte, bis die LED nicht mehr blinkt, und drücke erneut. Wiederhole das, bis die LED viermal blinkt.
3. Halte die Taste zwei Sekunden gedrückt. Das zählt nur einmal. Lass sie vor dem nächsten Druck los.

## Was passiert hier
Ein Pull-up-Widerstand hält P3.2 auf HIGH. Beim Drücken verbindet die Taste den Pin mit Masse. Durch die Deklaration `ACTIVE LOW` liefert `read button` beim Drücken den Wert 1. Nach dem Blinken wartet das Programm eine halbe Sekunde und nimmt erst nach dem Loslassen den nächsten Tastendruck an. So werden weder eine gehaltene Taste noch Prellen während der Wartezeit mehrfach gezählt.

## Warum das wichtig ist
Einen Taster auszulesen und Ereignisse zu zählen, ist grundlegend für jedes interaktive Gerät — Aufzüge, Automaten, Fernbedienungen. Entprellung ist ein Problem, dem jeder Ingenieur begegnet, und es früh zu lernen verhindert mysteriöse Doppelzählungen später.

## Weiter geht's
- [11-toggle-button](../11-toggle-button) — mit einer Taste die LED ein- und ausschalten statt zu zählen.
- [01-blink](../01-blink) — das einfachere Nur-Ausgabe-Programm nochmal ansehen, wenn der Tastereingang komplex wirkt.
- Experiment: Füge einen Reset hinzu — wenn die Taste länger als 2 Sekunden gehalten wird, setze den Zähler auf null zurück.
