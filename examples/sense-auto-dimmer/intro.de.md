---
level: intermediate
age: 12+
prereqs: [02-dimmer, 03-night-light]
teaches: [ldr, pwm, mapping, auto-ranging, rate-limiting]
---
## Was du siehst
Eine Lampe, die fehlendes Tageslicht ergänzt: Im dunklen Raum leuchtet sie hell, im hellen Raum dimmt sie fast auf nichts, und dazwischen findet sie ihre eigene Helligkeit. Ändert sich das Licht plötzlich — eine Hand über dem Sensor —, gleitet die Lampe zur neuen Helligkeit, statt zu springen.

## Probier das
1. Starte das Programm und verändere die Helligkeit am LDR von hell nach dunkel. Die Lampe wird heller, je dunkler der Raum wird.
2. Springe mit der Helligkeit in einem Zug von einem Ende zum anderen. Die Lampe braucht etwa eine Sekunde, um zu folgen.
3. Ändere die Schrittweite von 5 auf 1 und probiere es noch einmal. Was fällt dir auf, und wann wäre was besser?

## Was passiert hier
Der ADC-Messwert reicht von 0 (dunkel) bis zum hellsten Wert, den das Board lesen kann — 1023 bei den meisten Boards hier, 4095 beim Pico und beim STM32. Deshalb setzt das Programm keinen Bereich voraus: Es merkt sich den hellsten bisher gemessenen Wert und skaliert darauf, ein Trick namens automatische Bereichswahl (Auto-Ranging). Dann dreht es den Messwert um und macht daraus eine Helligkeit von 100 bis 0 Prozent. Pulsweitenmodulation (PWM) lässt die LED dunkler wirken, indem sie sehr schnell ein- und ausgeschaltet wird und sich ändert, wie lange sie in jedem Takt an ist.

Statt die Zielhelligkeit direkt zu schreiben, lässt das Programm seine aktuelle Helligkeit höchstens 5 Prozent pro Schritt auf das Ziel zulaufen. Diese kleine Regel ist ein Ratenbegrenzer: Sie verbirgt Flackern und plötzliche Sprünge, die bei einer echten Lampe stören würden.

## Warum das wichtig ist
Handybildschirme, Armaturenbretter und Straßenlaternen passen sich dem Umgebungslicht an, und alle glätten die Änderung, damit man sie nicht bemerkt. Einen Wertebereich auf einen anderen abzubilden und zu begrenzen, wie schnell sich ein Ausgang ändern darf, gehören zu den nützlichsten Werkzeugen in Steuerungscode.

## Weiter geht's
- [02-dimmer](../02-dimmer) — derselbe PWM-Ausgang, gesteuert mit der Hand an einem Drehknopf.
- [sense-twilight-switch](../sense-twilight-switch) — Ein/Aus-Steuerung statt stufenloser Helligkeit.
- Experiment: Lass die Lampe oberhalb einer bestimmten Helligkeit ganz aus, damit sie bei Tageslicht nie schwach glimmt.
