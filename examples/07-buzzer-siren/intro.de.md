---
level: beginner
age: 8+
prereqs: [01-blink]
teaches: [tone-output, buzzer, frequency]
---
## Was du siehst
Ein Summer am MCU spielt eine Zwei-Ton-Sirene, die zwischen 440 Hz und 880 Hz wechselt. Jeder Ton dauert eine halbe Sekunde, bevor umgeschaltet wird — ein klassischer Alarmsound.

## Probier das
1. Starte das Programm und höre die abwechselnd hohe und tiefe Sirene.
2. Ändere eine Frequenz auf 1000 Hz und höre, wie sich der Klang verändert.
3. Setze beide Töne auf dieselbe Frequenz — die Sirene wird zu einem Dauerton.

## Was passiert hier
Der MCU erzeugt eine Rechteckwelle am Summer-Pin, indem er ihn mit der richtigen Rate umschaltet. Für 440 Hz wird der Pin alle 1,136 ms umgeschaltet (halbe Periodendauer einer 440-Hz-Welle). Die Anweisung `set BUZZER to 440 hz` übernimmt das Timing. Der Summer enthält ein Piezo-Element oder einen kleinen Lautsprecher, der mit der Frequenz der Rechteckwelle schwingt. Durch den Wechsel zwischen zwei Frequenzen mit einer Pause dazwischen erzeugt das Programm einen Sireneneffekt.

## Warum das wichtig ist
Akustische Rückmeldung ist in eingebetteten Systemen unverzichtbar — Alarme, Benachrichtigungen, Benutzerbestätigungen. Einen Ton mit einem digitalen Pin zu erzeugen ist eine der einfachsten Möglichkeiten, einem Projekt Sound hinzuzufügen, und das Verständnis von Frequenz als „Umschaltungen pro Sekunde" verbindet Code mit Physik.

## Weiter geht's
- [01-blink](../01-blink) — dasselbe Umschalt-Konzept, aber langsam genug zum Sehen statt Hören.
- [05-counter-7seg](../05-counter-7seg) — einen Piepton bei jedem Tastendruck hinzufügen.
- Experiment: Erstelle einen Drei-Ton-Alarm, indem du eine dritte Frequenz hinzufügst und alle drei durchläufst.
