---
level: intermediate
age: 10+
prereqs: [01-blink, 11-toggle-button]
teaches: [pir, digital-sensor, hold-time]
---
## Was du siehst
Ein Passiv-Infrarot-Bewegungsmelder (PIR) beobachtet den Raum. Bewegt sich jemand, geht eine Lampen-LED an und der Summer piept zweimal. Die Lampe bleibt nach der letzten Bewegung noch fünf Sekunden an, und jede neue Bewegung startet diese fünf Sekunden von vorn — genau wie eine Flurbeleuchtung mit Bewegungsmelder.

## Probier das
1. Starte das Programm und schalte beim PIR die Bewegung ein: Die Lampe leuchtet und der Summer piept.
2. Schalte die Bewegung aus und zähle mit: Etwa fünf Sekunden später geht die Lampe aus.
3. Schalte die Bewegung mehrmals schnell ein und aus. Die Lampe bleibt an, aber der Summer piept nur einmal — finde die Zeile, die dafür sorgt.

## Was passiert hier
Ein PIR-Modul hat eine eigene kleine Schaltung, die eine Änderung im Infrarotlicht in ein sauberes digitales Signal verwandelt: LOW, wenn sich nichts bewegt, HIGH, solange sich etwas bewegt. Weil das Modul die Leitung selbst treibt, braucht der MCU-Pin keinen Pull-up-Widerstand — anders als ein Taster, der nur verbindet oder trennt.

Das Programm wartet nicht fünf Sekunden am Stück. Eine lange Wartezeit würde das Programm einfrieren, und es könnte neue Bewegungen nicht bemerken. Stattdessen wird bei jeder Erkennung ein Zähler auf 50 gesetzt und alle 100 ms um eins heruntergezählt; die Lampe ist an, solange der Zähler über null liegt.

## Warum das wichtig ist
„Nach dem letzten Ereignis noch eine Weile anlassen" begegnet dir überall: Treppenhauslicht, Bildschirmschoner, der Händetrockner, der noch kurz weiterbläst. Ein Countdown, den jedes neue Ereignis zurücksetzt, ist der übliche Weg, das zu bauen, ohne den Rest des Programms zu blockieren.

## Weiter geht's
- [sense-clap-switch](../sense-clap-switch) — noch ein Modul, das seinen Ausgang selbst treibt, diesmal für Geräusche.
- [sense-twilight-switch](../sense-twilight-switch) — mit einem Lichtsensor reagiert die Lampe nur bei Dunkelheit.
- Experiment: Mach die Nachlaufzeit einstellbar — jede weitere Erkennung verlängert sie, bis zu einem Höchstwert.
