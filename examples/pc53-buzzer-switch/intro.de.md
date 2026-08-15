---
level: beginner
age: 8+
prereqs: []
teaches: [buzzer, switch, simple-circuit]
---
## Was du siehst
Ein Summer, der ueber einen Schalter mit einer Batterie verbunden ist. Druecke den Schalter und der Summer ertönt; lass ihn los und der Summer stoppt. Die einfachste moegliche interaktive Schaltung.

## Probier das
1. Klicke den Schalter und hoere den Summer.
2. Lass den Schalter los und pruefe, dass der Summer sofort aufhoert.
3. Fuege einen zweiten Summer parallel hinzu und hoere, wie beide gleichzeitig klingen.

## Was passiert hier
Der Schalter unterbricht den Strompfad vom Pluspol der Batterie durch den Summer zur Masse. Wenn der Schalter offen ist, fliesst kein Strom und der Summer ist still. Wenn du ihn schliesst, fliesst Strom durch den internen Oszillator des Summers, der eine Membran zum Schwingen bringt und Ton erzeugt. Kein Mikrocontroller oder Programmierung ist beteiligt — reine Hardware, die eine Sache zuverlaessig tut.

## Warum das wichtig ist
Das ist die Grundlage aller interaktiven Elektronik: eine menschliche Aktion (Knopf druecken) steuert einen physischen Ausgang (Ton). Jede Tuerklingel, jeder Alarm und jedes Benachrichtigungssystem basiert auf diesem Prinzip. Es baut Intuition dafuer auf, wie Schalter den Stromfluss steuern.

## Weiter geht's
- [pc60-night-lamp-hardware](../pc60-night-lamp-hardware) — eine Schaltung, die automatisch statt manuell schaltet.
- [pc62-motor-indicator](../pc62-motor-indicator) — ein Schalter steuert einen Motor mit Status-LED.
- Experiment: Fuege einen Widerstand in Reihe zum Summer hinzu und hoere, ob sich die Lautstaerke aendert — manche Summer sind spannungsgesteuert und reagieren nicht, waehrend andere leiser werden.
