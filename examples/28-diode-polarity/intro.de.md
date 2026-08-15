---
level: beginner
age: 8+
prereqs: [01-blink]
teaches: [diode-polarity, forward-reverse, current-direction]
---

## Was du siehst

Eine Diode ist zwischen einem MCU-Ausgangspin und einer LED geschaltet. Das
Programm wechselt zwischen High und Low am Pin. In einer Richtung leuchtet die
LED; in der anderen bleibt sie dunkel. Die Diode ist der Waechter -- sie laesst
Strom in eine Richtung durch und sperrt ihn in der anderen.

## Probier das aus

1. Klick auf **Sim**. Die LED blinkt eine Sekunde an, bleibt dann eine Sekunde
   aus, und das wiederholt sich.
2. Schau dir das Diodensymbol im Schaltplan an. Das Dreieck zeigt von der
   Anode zur Kathode -- der Strom fliesst in die Richtung, in die das Dreieck
   zeigt.
3. Tausche im Schaltungseditor die Anoden- und Kathodenverbindungen der Diode.
   Starte die Simulation erneut. Jetzt ist die LED dunkel, wenn sie vorher
   leuchtete, und umgekehrt.

## Was passiert hier

Eine Diode ist ein Einwegventil fuer elektrischen Strom. Wenn Strom von der
Anode zur Kathode fliessen will (Durchlassrichtung), leitet die Diode und es
fallen etwa 0,7 V ueber ihr ab. Wenn Strom andersherum fliessen will
(Sperrrichtung), sperrt die Diode und es fliesst praktisch kein Strom. Der
MCU-Pin wechselt zwischen High und Low, sodass die Diode in einer Phase in
Durchlassrichtung gepolt ist und die LED leuchtet, und in der anderen Phase
in Sperrrichtung -- und die LED dunkel bleibt.

## Warum das wichtig ist

Verpolungsschutz, Gleichrichtung und Signalweiterleitung haengen alle von der
Einwegeigenschaft der Diode ab. Eine falsch herum eingebaute Diode ist einer
der haeufigsten Verdrahtungsfehler, und das Verstaendnis von Durchlass- und
Sperrrichtung ist der erste Schritt zum Verstaendnis von Transistoren, die der
Grundbaustein jeder digitalen Schaltung sind.

## Weiter geht's

- **Woher die LED-Grundlagen kommen:** [01-blink](../01-blink) -- die
  einfachste LED-Schaltung.
- **Eine Diode schuetzt eine Schaltung:**
  [33-inductive-no-flyback](../33-inductive-no-flyback) -- was passiert, wenn
  die Schutzdiode fehlt.
- **Zum Ausprobieren:** Fuege eine zweite LED in der entgegengesetzten Richtung
  ein (Kathode zum Pin, Anode nach Masse). Jetzt leuchtet eine LED, wenn der
  Pin High ist, und die andere, wenn er Low ist -- ein visueller
  Polaritaetsanzeiger.
