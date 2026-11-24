# Ein unabgestimmter Ferritstab hört alle Sender auf einmal

Die Ferritantenne eines Radios sitzt normalerweise in einem Schwingkreis, der einen Sender auswählt. Lässt man den Drehkondensator weg und legt die Wicklung des Stabs an einen Transistorverstärker, hört man alle Sender gleichzeitig, durcheinander. Ein kleiner Kondensator lässt sie alle verschwinden.

**Vermittelt:** ein Übergang demoduliert Rundfunksignale, ein Schwingkreis wählt sie aus, ein Kondensator leitet Hochfrequenz ab

## Was zu tun ist

Klick auf **Sim** und hör zu. Schieb dann den Schiebeschalter nach rechts: Er legt einen 4,7-nF-Kondensator von der Basis des Transistors nach Masse. Schieb ihn zurück. Dreh den Regler der Feldsonde (deine Hand, über einem Blatt Papier nah am Stab) auf und zu.

## Was du sehen solltest

- Ohne Kondensator: die Programme der Sender spielen zusammen im Lautsprecher; die LED flackert mit.
- Mit Kondensator: die Sender sind weg.
- Hand nah: ein tiefes Brummen.

## Warum es funktioniert

Die Radiowelle jedes Senders erzeugt in der Wicklung des Stabs eine winzige Spannung. Nichts ist abgestimmt, also erreichen alle die Basis des Transistors. Der Basis-Emitter-Übergang leitet in eine Richtung besser als in die andere und macht so aus der Radiowelle jedes Senders wieder seinen Ton: Alle kommen gleichzeitig heraus. Der 4,7-nF-Kondensator ist für Hochfrequenz fast ein Kurzschluss (etwa 34 Ω bei 1 MHz), den Ton berührt er kaum, also erreichen die Sender den Übergang nicht mehr. Dein Körper nimmt das Brummen der Stromleitungen im Raum auf und gibt es an die Basis weiter.
