---
level: beginner
age: 8+
prereqs: [05-counter-7seg]
teaches: [debounce, switch-bounce, software-filter]
---

## Was du siehst

Ein Taster schaltet eine LED um: einmal druecken, einmal umschalten. Das klingt
zu einfach fuer ein Programm, und genau daran scheitert ein blosses
`wait until pressed`. Ein echter Schalter schliesst nicht sauber -- seine
Kontakte prellen einige Millisekunden lang, und der MCU ist schnell genug, jedes
Prellen als eigenen Druck zu lesen. Dann flackert die LED oder bleibt im
falschen Zustand. Die 50 ms Wartezeit in diesem Programm sorgen dafuer, dass ein
Druck genau ein Umschalten bedeutet. Dieses Beispiel funktioniert auf allen unterstützten Mikrocontrollern — wähle ein anderes Gerät in der Werkzeugleiste, um die angepasste Schaltung zu sehen.

## Probier das aus

1. Klick auf **Sim** und drueck den Taster einmal. Die LED wechselt genau
   einmal den Zustand, egal wie schnell du loslaesst.
2. Drueck ihn mehrmals schnell hintereinander. Jeder Druck bleibt ein
   Umschalten -- das Programm wartet, bis die Kontakte zur Ruhe kommen, bevor
   es eine Flanke glaubt.
3. Loesch die beiden `wait 0.05 seconds` Zeilen und drueck noch einmal. Auf
   echter Hardware landet die LED dann etwa so oft im falschen wie im richtigen
   Zustand -- genau der Fehler, den dieses Muster beseitigt.

## Was passiert hier

Ein mechanischer Schalter stellt beim Druecken keinen sauberen Kontakt her. Die
Metallkontakte prellen buchstaeblich auseinander und beruehren sich ueber einige
Millisekunden hinweg mehrfach, was einen Burst aus An-Aus-An-Uebergaengen
erzeugt, den der MCU als mehrere Tastendrucke liest. Die Software-Loesung ist
einfach: Nach dem Erkennen eines Drucks werden weitere Aenderungen fuer 20--50 ms
ignoriert. Wenn dieses Zeitfenster vorbei ist, haben sich die Kontakte beruhigt,
und der naechste echte Druck ist wirklich ein neues Ereignis.

## Warum das wichtig ist

Jeder Taster, Schalter und Relaiskontakt in jedem Geraet, das du je benutzt
hast, hat dieses Problem, und jedes davon hat eine Entprellung -- in Software,
in Hardware oder beides. Ohne sie drueckt der Benutzer einmal und das Geraet
reagiert doppelt.

## Weiter geht's

- **Wo Prellen am meisten stoert:**
  [25-reaction-timer](../25-reaction-timer) -- ein prellender Druck fuegt der
  Zeitmessung falsche Millisekunden hinzu.
- **Der Zaehler, auf dem das aufbaut:**
  [05-counter-7seg](../05-counter-7seg) -- der einfache tastergesteuerte
  Zaehler ohne Entprellung.
- **Zum Ausprobieren:** Aendere die Entprellzeit von 20 ms auf 200 ms. Drueck
  jetzt zweimal schnell hintereinander -- der zweite Druck wird verschluckt.
  Zu aggressive Entprellung frisst echte Eingaben.
