---
level: beginner
age: 8+
prereqs: [pc09-direct-led]
teaches: [series-leds, voltage-sharing]
---
## Was du siehst
Zwei LEDs in Reihe — rot und grün — versorgt über einen 470-Ω-Widerstand von einer 9-V-Batterie. Beide leuchten und teilen sich die verfügbare Spannung.

## Probier das
1. Klick auf **Sim** und überprüfe, dass beide LEDs leuchten.
2. Prüfe die Spannung über jeder LED — beide liegen bei etwa 2 V.
3. Entferne eine LED (trenne sie ab). Die verbleibende LED wird heller, weil sie das Spannungsbudget nicht mehr teilen muss.

## Was passiert hier
In einer Reihenschaltung fließt durch jedes Bauteil derselbe Strom. Jede LED braucht etwa 2 V, zusammen also 4 V. Der Widerstand bekommt die verbleibenden 5 V, was den Strom auf 5 V / 470 Ω ≈ 10,6 mA festlegt. Man kann LEDs nur so lange in Reihe schalten, wie die Versorgungsspannung höher ist als die Summe ihrer Flussspannungen — hier reichen 9 V für zwei, aber nicht für vier.

## Warum das wichtig ist
LED-Streifen nutzen Reihengruppen, um sich einen Vorwiderstand zu teilen — das spart Bauteile und Energie. Zu wissen, wie viele LEDs man in Reihe schalten kann, bevor die Spannung nicht mehr reicht, ist beim Entwerfen unerlässlich.

## Weiter geht's
- [pc09-direct-led](../pc09-direct-led) — fang mit einer einzelnen LED an.
- [pc11-direct-parallel](../pc11-direct-parallel) — die Alternative: zwei LEDs nebeneinander.
- Experiment: Wie viele 2-V-LEDs kannst du mit 9 V in Reihe schalten, bevor der Strom gegen null geht?
