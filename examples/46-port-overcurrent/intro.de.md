---
level: advanced
age: 16+
prereqs: [01-blink]
teaches: [port-current-limit, aggregate-current, chip-protection]
---
## Was du siehst
Acht LEDs an einem einzigen MCU-Port, alle gleichzeitig eingeschaltet. Jede LED zieht etwa 20 mA, zusammen 160 mA — aber der Port ist nur fuer 100 mA Gesamtstrom ausgelegt. Die Simulation zeigt, wie der Gesamtstrom das absolute Maximum des Chips ueberschreitet, ein Zustand, der echte Hardware beschaedigen wuerde.

## Probier das
1. Starte die Simulation mit allen acht LEDs an und lies den gesamten Portstrom ab.
2. Schalte die Haelfte der LEDs aus und bestaetie, dass der Gesamtstrom auf ein sicheres Niveau sinkt.
3. Fuege einen Transistortreiber fuer eine LED hinzu und beobachte, dass deren Strom nicht mehr gegen das Portlimit zaehlt.

## Was passiert hier
Jedes Mikrocontroller-Datenblatt nennt zwei Stromgrenzen: pro Pin (typisch 20 mA) und pro Port (typisch 100 mA). Man kann das Pro-Pin-Limit an jedem Pin einhalten und trotzdem das Pro-Port-Limit ueberschreiten, wenn zu viele Pins gleichzeitig Strom liefern. Das Ueberschreiten des Gesamtlimits fuehrt dazu, dass der Chip ueberhitzt, Spannungsregler einbrechen und im Extremfall Bonddraehte im Gehaeuse durchschmelzen. Die Loesung sind Transistoren oder Treiber-ICs fuer Hochstromlasten, damit der Strom von der Versorgung fliesst, nicht durch den Chip.

## Warum das wichtig ist
Das ist einer der haeufigsten Anfaengerfehler im Embedded-Design. Ein Projekt funktioniert mit ein oder zwei LEDs, versagt aber raetselhaft beim Hochskalieren. Gesamtstromgrenzen zu verstehen verhindert verbrannte Chips und lehrt, Datenblaetter sorgfaeltig zu lesen.

## Weiter geht's
- [38-npn-switch](../38-npn-switch) — nutze einen Transistor, um eine LED anzutreiben, ohne den MCU-Pin zu belasten.
- [08-led-chaser-595](../08-led-chaser-595) — nutze ein Schieberegister, um viele LEDs mit nur wenigen MCU-Pins anzusteuern.
- Experiment: Schlag im Datenblatt deines MCU die Stromgrenzen pro Pin und pro Port nach und berechne die maximale Anzahl von 20-mA-LEDs, die du direkt treiben kannst.
