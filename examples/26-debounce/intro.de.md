---
level: beginner
age: 8+
prereqs: [05-counter-7seg]
teaches: [debounce, switch-bounce, software-filter]
---

## Was du siehst

Ein Taster ist mit dem MCU verbunden und ein Zaehler wird auf einer
7-Segment-Anzeige dargestellt. Jeder Druck sollte den Zaehler um eins erhoehen,
aber ohne Entprellung springt der Zaehler bei einem einzigen Druck um zwei, drei
oder mehr. Das Programm zeigt den rohen (prellenden) Zaehlerstand und den
entprellten (sauberen) Zaehlerstand nebeneinander. Dieses Beispiel funktioniert auf allen unterstützten Mikrocontrollern — wähle ein anderes Gerät in der Werkzeugleiste, um die angepasste Schaltung zu sehen.

## Probier das aus

1. Klick auf **Sim** und drueck den Taster einmal. Beobachte den rohen
   Zaehler -- er springt wahrscheinlich um mehr als eins.
2. Schau dir den entprellten Zaehler daneben an. Er zaehlt pro Druck genau
   um eins hoch.
3. Drueck den Taster mehrmals schnell hintereinander und vergleiche beide
   Zaehler. Der rohe Zaehler eilt voraus; der saubere bleibt genau.

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
