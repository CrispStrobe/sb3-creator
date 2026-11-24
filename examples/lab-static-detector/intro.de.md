# Detektor für elektrische Ladung

Ein Darlington-Paar mit einem blanken Draht an der Basis. Bring ein geriebenes Kunststofflineal an den Draht heran, und die LED leuchtet, solange sich das Lineal bewegt.

**Vermittelt:** Influenz, Strom als bewegte Ladung, Darlington-Verstärkung

## Was zu tun ist

Klick auf **Sim**. Dreh den Knopf der Sonde von 0 auf 1: Das bringt das geladene Lineal nah an den Draht (die Hand braucht etwa 0,2 s). Dreh ihn dann zurück auf 0.

## Was du sehen solltest

- Lineal kommt näher: Die LED leuchtet schwach, solange es sich bewegt, und geht wieder aus, wenn es still steht.
- Lineal entfernt sich: Die LED bleibt dunkel; die Basis wird stattdessen negativ.

## Warum es funktioniert

Das geladene Lineal zieht entgegengesetzte Ladung ins nahe Ende des Drahts und schiebt gleichnamige Ladung in die Basis des Transistors. Nur solange sich das Lineal bewegt, ändert sich diese Ladung, nur dann fließt ein Strom, einige Nanoampere. Das Darlington-Paar vervielfacht ihn etwa 40 000-fach, genug für die LED. Entfernt sich das Lineal, fließt der Strom andersherum, und damit kann eine Transistorbasis nichts anfangen.
