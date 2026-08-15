---
level: beginner
age: 12+
prereqs: [pc26-motor-clamp]
teaches: [motor-indicator, status-led, parallel-indicator]
---
## Was du siehst
Ein Motor, der ueber einen Schalter gesteuert wird, mit einer LED parallel als Betriebsanzeige. Wenn der Motor laeuft, leuchtet die LED und zeigt an, dass er aktiv ist. Wenn der Motor stoppt, geht die LED aus.

## Probier das
1. Schliesse den Schalter und beobachte, wie der Motor dreht und die LED leuchtet.
2. Oeffne den Schalter und pruefe, dass Motor und LED zusammen stoppen.
3. Versuche, die LED abzudecken, und beachte, dass der Motor trotzdem laeuft — die Anzeige beeinflusst den Motor nicht.

## Was passiert hier
Die LED und ihr Vorwiderstand sind parallel zum Motor geschaltet. Wenn der Schalter schliesst, fliesst Strom durch beide Pfade: der Motor zieht seinen Betriebsstrom, und eine kleine Menge fliesst durch den Widerstand und die LED. Der LED-Strom ist winzig im Vergleich zum Motorstrom, sodass er die Motorleistung nicht beeinflusst. Der Widerstand begrenzt den LED-Strom auf ein sicheres Niveau — ohne ihn wuerde die LED durch die Versorgungsspannung zerstoert.

## Warum das wichtig ist
Statusanzeigen sind unverzichtbar in jedem System, in dem ein Motor oder Aktor nicht direkt sichtbar ist. Industrieanlagen, eingeschlossene Luefter, Pumpen hinter Waenden — alle brauchen eine Moeglichkeit zu bestaetigen, dass sie laufen. Eine parallele LED ist die guenstigste und zuverlaessigste Anzeige und braucht keine zusaetzliche Steuerlogik.

## Weiter geht's
- [pc26-motor-clamp](../pc26-motor-clamp) — Motorschutz mit einer Freilaufdiode.
- [pc53-buzzer-switch](../pc53-buzzer-switch) — ein weiteres einfaches geschaltetes Ausgangsgeraet.
- Experiment: Fuege eine zweite LED in einer anderen Farbe hinzu, die leuchtet, wenn der Motor aus ist (mit einem Inverter oder einem zweiten Strompfad), um ein Lauf/Stopp-Anzeigepaar zu erstellen.
