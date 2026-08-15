---
level: beginner
age: 12+
prereqs: [pc02-voltage-divider]
teaches: [thermistor, ntc, sensor, voltage-divider, resistance-to-voltage]
---

## Was du siehst

Zwei Bauteile in einer Reihe zwischen 5 V und Masse, und einen Draht, der vom
Punkt dazwischen weggeht. Das obere ist ein **Thermistor** — ein Widerstand,
dessen Wert davon abhängt, wie warm er ist. Der Punkt dazwischen ist der Ausgang
der Schaltung, und nur er ist hier überhaupt interessant.

## Probier das aus

1. Klick auf **Sim** und zieh den Temperaturregler des NTC auf kalt. Der Abgriff
   zeigt **0,45 V**.
2. Zieh ihn auf heiß. Der Abgriff zeigt **4,55 V**.
3. Stell ihn genau in die Mitte: **2,50 V**, exakt die halbe
   Versorgungsspannung.
4. Prüf Schritt 3 mit der Teilerformel nach: Der NTC hat dort 10 kΩ, genau wie
   `r1`, und zwei gleiche Widerstände teilen eine Spannung immer halbe-halbe.
5. Ändere `r1` von 10000 auf 1000 Ohm und fahr den Regler noch einmal durch. Der
   ganze Ausgangsbereich rutscht nach unten — die Schaltung ist jetzt bei einer
   anderen Temperatur am empfindlichsten.

## Was dahintersteckt

Ein Thermistor macht aus Temperatur einen Widerstand. Das ist wirklich nützlich,
nur kann nichts in deiner Schaltung einen Widerstand direkt lesen: Messgeräte,
Chip-Eingänge und Komparatoren lesen alle *Spannung*. Der Teiler ist der
Übersetzer.

Es gilt dieselbe Regel wie bei jedem Spannungsteiler: Der Abgriff liegt bei der
Versorgungsspannung mal dem unteren Widerstand geteilt durch die Summe. Ist der
NTC kalt, hat er 100 kΩ — riesig im Vergleich zu den 10 kΩ darunter — und nimmt
sich fast die ganzen 5 V, sodass der Abgriff unten bei 0,45 V liegen bleibt. Wird
er heiß, bricht sein Widerstand auf 1 kΩ ein; jetzt ist `r1` der Große, behält
den Großteil der Spannung, und der Abgriff steigt auf 4,55 V.

**NTC** heißt *negativer Temperaturkoeffizient*: heißer bedeutet weniger
Widerstand. Das ist genau andersherum als bei den Metalldrähten, die du kennst —
und genau das macht diese Bauteile als Sensoren so brauchbar.

In Schritt 5 steckt die eigentliche Entwurfsentscheidung. `r1` legt fest, *wo*
der Teiler am empfindlichsten ist. Der Ausgang bewegt sich am schnellsten, wenn
beide Widerstände ähnlich groß sind. `r1` = 10 kΩ heißt also: "sei dort am
empfindlichsten, wo der Thermistor 10 kΩ hat" — man wählt `r1` passend zu der
Temperatur, die einen wirklich interessiert, bei einem Raumsensor also zum Wert
des Thermistors bei etwa 25 °C.

## Warum das wichtig ist

In jedem Thermostat, jedem Kühlschrank, jedem 3D-Drucker-Hotend und jedem
Akkuladegerät steckt so etwas, meist direkt am Analogeingang eines
Mikrocontrollers. Derselbe Zwei-Widerstands-Trick misst auch Licht (nimm einen
LDR), Druck, Feuchte und Dehnung — jeder Sensor, dessen Ausgabe ein Widerstand
ist, wird so zu einer Spannung.

## Wie es weitergeht

- **Zuerst:** [pc02-voltage-divider](../pc02-voltage-divider) — dieselbe Formel
  mit zwei festen Widerständen.
- **Zum Vergleich:** [pc24-light-gate](../pc24-light-gate) — dieselbe Schaltung,
  nur für Licht.
- **Als Nächstes:** [pc55-ntc-indicator](../pc55-ntc-indicator) — der Teiler
  treibt etwas an, statt nur gemessen zu werden.
- **Danach:** [pc48-ldr-comparator](../pc48-ldr-comparator) — aus der
  gleitenden Spannung eine Ja/Nein-Entscheidung machen.
- **Zum Ausprobieren:** Vertausch NTC und `r1`, sodass der Thermistor *unten*
  sitzt. Fahr den Regler noch einmal durch: Jetzt fällt die Ausgangsspannung,
  wenn es wärmer wird. Manchmal will man genau das, und es kostet nichts außer
  der Reihenfolge zweier Bauteile.
