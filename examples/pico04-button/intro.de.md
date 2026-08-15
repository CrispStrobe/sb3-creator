---
level: beginner
age: 12+
prereqs: [pico01-blink]
teaches: [button-input, digital-input, led-control]
---
## Was du siehst
Ein Taster an einem GPIO-Pin des Raspberry Pi Pico steuert eine LED. Druecke den Taster und die LED geht an; lass ihn los und die LED geht aus. Die einfachste Eingang-zu-Ausgang-Verbindung.

## Probier das
1. Druecke und halte den Taster — die LED leuchtet. Lass los — die LED geht aus.
2. Druecke schnell hintereinander und sieh, wie die LED sofort folgt.
3. Aendere das Programm, um die Logik umzukehren: LED an wenn der Taster losgelassen ist, aus wenn gedrueckt.

## Was passiert hier
Der Taster verbindet den GPIO-Pin mit Masse, wenn er gedrueckt wird. Der interne Pull-up-Widerstand des Pico haelt den Pin auf high, wenn der Taster offen ist. Das Programm liest den Pin-Zustand in einer Schleife: wenn es low liest (Taster gedrueckt), schaltet es den LED-Pin auf high; wenn es high liest (Taster losgelassen), schaltet es den LED-Pin auf low. In dieser einfachen Version gibt es kein Entprellen, aber die Reaktion ist schnell genug, dass Prellen fuer das Auge nicht sichtbar ist.

## Warum das wichtig ist
Einen Taster zu lesen ist die grundlegendste Form der Benutzereingabe. Jedes Bedienfeld, jeder Spielcontroller und jede Benutzeroberflaeche beginnt mit der Erkennung eines Tastendrucks. Sobald du einen Taster zuverlaessig lesen kannst, kannst du viele lesen, Entprellen hinzufuegen, lange Druecke erkennen und vollstaendige Eingabesysteme bauen.

## Weiter geht's
- [pico01-blink](../pico01-blink) — nur Ausgabe, keine Eingabe.
- [pico03-two-tasks](../pico03-two-tasks) — mehr als eine Sache tun, waehrend der Taster ueberwacht wird.
- Experiment: Fuege einen Zaehler hinzu, der sich bei jedem Druck erhoeht und den Stand seriell ausgibt — wahrscheinlich springt der Zaehler um mehr als eins pro Druck, das ist Prellen in Aktion.
