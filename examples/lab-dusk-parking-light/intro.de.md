# Parklicht, das auf echte Dämmerung wartet

Ein automatisches Parklicht darf in der langsam einsetzenden Dämmerung nicht an- und ausblinken. Dieses geht an, wenn es wirklich dunkel ist, und erst wieder aus, wenn es deutlich heller ist.

**Vermittelt:** Lichtmessung, Schmitt-Trigger, Komparator mit Lampe

## Was zu tun ist

Klick auf **Sim**. Schieb den Regler **light** des Fototransistors langsam auf 0,1 herunter und dann wieder auf 0,5 hoch.

## Was du sehen solltest

- Das weiße Licht geht bei etwa 0,15 an.
- Auf dem Rückweg bleibt es über 0,2 hinaus an und geht erst bei etwa 0,25 aus.

## Warum es funktioniert

Die beiden Transistoren mit gemeinsamem Emitterwiderstand bilden einen Schmitt-Trigger: Hat er geschaltet, muss der Eingang merklich weiter zurück, um ihn wieder umzuschalten. Der Verstärker vergleicht den Ausgang des Triggers mit festen 3 V und treibt die Lampe mit seinem vollen Ausgang.
