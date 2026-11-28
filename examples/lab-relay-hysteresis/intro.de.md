# Relais-Hysterese: ein bei einer Spannung, aus bei einer anderen

Ein Relais schaltet nicht bei einer Spannung, sondern bei zweien. Es zieht erst an, wenn die Spule genug Spannung bekommt, hält dann mit viel weniger und fällt erst weit darunter wieder ab. Dazwischen merkt es sich, was es gerade tut.

**Vermittelt:** Anzugs- und Abfallspannung, Hysterese, Relais als Speicher, Emitterfolger

## Was zu tun ist

Klick auf **Sim**. Dreh LEVEL (potentiometer_3) langsam auf und beobachte das Spulen-Voltmeter (voltmeter_8) und die beiden LEDs. Wenn das Relais anzieht, dreh LEVEL langsam wieder zurück. Stell LEVEL dann auf die Mitte (0.5) und drück einmal TAP (button_9).

## Was du sehen solltest

- Beim Aufdrehen: OUT (led_15, grün) leuchtet, bis die Spule 6 V erreicht (LEVEL etwa 0.84); dann zieht das Relais an und IN (led_13, rot) leuchtet.
- Beim Zurückdrehen: das Relais bleibt bei 5 V, 4 V, 3 V angezogen. Es fällt erst bei 2,5 V ab (LEVEL etwa 0.4).
- Wieder aufdrehen: es bleibt abgefallen, bis wieder 6 V erreicht sind.
- Bei LEVEL 0.5 (etwa 3,1 V an der Spule) ist das Relais abgefallen. Ein Druck auf TAP lässt es anziehen, und es bleibt auch nach dem Loslassen an.

## Warum es funktioniert

Der Transistor überträgt die Spannung des Reglers auf die Spule und liefert den Strom, den der Regler allein nicht liefern könnte. Um den Anker über seinen Luftspalt zu ziehen, braucht die Spule ein starkes Feld; liegt der Anker am Kern an, ist der Spalt geschlossen, und ein viel schwächeres Feld hält ihn. Darum liegen Ein- und Ausschaltpunkt weit auseinander, und dazwischen behält das Relais seinen letzten Zustand. TAP gibt über einen Kondensator einen kurzen Stoß: die Spule sieht für ein paar Millisekunden über 8 V, genug zum Anziehen, und die Haltespannung von 3,1 V hält es fest.
