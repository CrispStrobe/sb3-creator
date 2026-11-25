# Darlington: verzögert an, langsam aus

**Vermittelt:** Darlington-Schaltung, RC-Zeitglied, Verzögerung

## Was zu tun ist

Klick auf **Sim**, dann schließ den Schalter AN (switch_3) und zähl die Sekunden, bis die LED leuchtet. Dann öffne ihn wieder und zähl, bis sie aus ist.

## Was du sehen solltest

- Nach dem Schließen: etwa eine Sekunde passiert nichts, dann wird die LED langsam hell und ist nach etwa 4 s ganz an.
- Nach dem Öffnen: Sie bleibt kurz an und verlischt dann innerhalb von etwa 4 s.

## Warum es funktioniert

Die beiden Transistoren zusammen brauchen etwa 1,1 V, bevor sie leiten, und der Kondensator braucht eine Weile, bis er sich über 100 kΩ so weit aufgeladen hat. Wenn AN öffnet, entlädt er sich über 47 kΩ, und die LED wird dunkler, wenn seine Spannung wieder unter diese Schwelle fällt.
