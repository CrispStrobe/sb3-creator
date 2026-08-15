---
level: intermediate
age: 12+
prereqs: [pc01-led-resistor]
teaches: [push-pull, switch-logic, mutual-exclusion]
---
## Was du siehst
Zwei Schalter, jeder steuert eine LED. Drücken des einen schaltet die obere LED ein; drücken des anderen die untere. Die Schaltung zeigt, wie zwei unabhängige Steuerpfade eine gemeinsame Versorgung teilen.

## Probier das
1. Klick auf **Sim** mit beiden Schaltern offen — beide LEDs sind dunkel.
2. Drücke einen Schalter — seine LED leuchtet, während die andere dunkel bleibt.
3. Drücke den anderen Schalter — jetzt sind beide LEDs an. Beachte, dass dies ein Verdrahtungszustand zum Überprüfen ist, nicht unbedingt ein normaler Betriebsmodus.

## Was passiert hier
Jeder Schalter schließt einen separaten Strompfad von der Versorgung über einen Widerstand und eine LED nach Masse. Die beiden Pfade sind elektrisch unabhängig: Einen zu drücken hat keine Auswirkung auf den anderen. Der Name „Gegentakt" bezieht sich auf die komplementäre Aktion — einer ist an, während der andere im Normalbetrieb aus ist, wie eine Statusanzeige, die zwei sich ausschließende Zustände zeigt.

## Warum das wichtig ist
Gegentaktanzeigen sind überall: Ein/Aus-Leuchten, Lade/Entlade-Status, Richtungsanzeiger. Zu verstehen, dass jeder Pfad unabhängig ist — und dass beide gleichzeitig zu drücken ein gültiger Schaltungszustand ist, auch wenn er nicht beabsichtigt ist — ist wichtig für das Design sicherer Verriegelungen.

## Weiter geht's
- [pc36-series-interlock](../pc36-series-interlock) — eine Schaltung, die verhindert, dass beide Pfade gleichzeitig aktiv sind.
- [pc01-led-resistor](../pc01-led-resistor) — der Einzeln-LED-Baustein.
- Experiment: Füge einen dritten Schalter und eine LED hinzu. Ändert das das Verhalten der vorhandenen zwei?
