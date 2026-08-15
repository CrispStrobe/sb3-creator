---
level: beginner
age: 8+
prereqs: []
teaches: [rgb-led, color-mixing, parallel-branches]
---
## Was du siehst
Eine RGB-LED mit drei separaten Kanaelen — rot, gruen und blau — jeweils mit eigenem Vorwiderstand. Durch Kombinieren der Kanaele kannst du Farben mischen: Rot plus Gruen ergibt Gelb, Rot plus Blau ergibt Magenta, alle drei zusammen ergeben Weiss.

## Probier das
1. Starte die Simulation mit allen drei Kanaelen an und beobachte das resultierende weisse Licht.
2. Schalte den blauen Kanal aus — die LED sollte gelb erscheinen (Rot + Gruen).
3. Probiere jeden Kanal einzeln und dann paarweise aus, um alle sechs Primaer- und Sekundaerfarben zu sehen.

## Was passiert hier
Eine RGB-LED enthaelt drei winzige LEDs in einem Gehaeuse mit einem gemeinsamen Pin. Jeder Farbkanal ist ein unabhaengiger Stromkreis mit eigenem Widerstand, sodass sich die Stroeme nicht gegenseitig beeinflussen. Das menschliche Auge mischt die drei Farben additiv — dasselbe Prinzip, das Handybildschirme und Monitore verwenden. Unterschiedliche Widerstandswerte an jedem Kanal passen die Helligkeitsverhaeltnisse und damit die wahrgenommene Farbe an.

## Warum das wichtig ist
Farbmischung mit RGB-LEDs ist die Methode, mit der Anzeigelichter, LED-Streifen und Displays Millionen von Farben aus nur drei Grundfarben erzeugen. Parallele Zweige und unabhaengige Strompfade zu verstehen ist fuer jede Mehrkanal-Schaltung wichtig.

## Weiter geht's
- [24-pwm-fade](../24-pwm-fade) — nutze PWM, um die Helligkeit stufenlos zu regeln statt nur an/aus, und erschliesse das volle Farbspektrum.
- [45-led-current-comparison](../45-led-current-comparison) — sieh, wie verschiedene Widerstandswerte die LED-Helligkeit beeinflussen.
- Experiment: Sage vorher, welche Farbe du bei Rot auf voller Helligkeit, Gruen auf halber (hoeherer Widerstand) und Blau aus erhaeltst, und pruefe es dann.
