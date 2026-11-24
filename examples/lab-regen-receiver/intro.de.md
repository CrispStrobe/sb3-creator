# Rückkopplungsempfänger: Rückkopplung bis zum Pfeifen

Ein Transistor, eine Ferritstab-Spule mit einer kleinen zweiten Wicklung und ein Knopf namens „Rückkopplung". Der Transistor richtet den Sender in seiner Basis-Emitter-Strecke gleich wie das Ein-Transistor-Radio, aber sein Kollektorstrom fließt auch durch die kleine Wicklung, die einen Teil der verstärkten HF zurück in den Schwingkreis gibt. Dreh den Knopf auf, und die Rückkopplung wächst, bis sie die Verluste des Kreises aufhebt: Von da an schwingt die Schaltung von selbst.

**Vermittelt:** Mitkopplung, die Schwingschwelle (Schleifenverstärkung eins), Überlagerungspfeifen

## Was zu tun ist

Klick auf **Sim**. Beginne mit dem Rückkopplungsknopf auf 0,9 (wenig Strom, wenig Rückkopplung) und hör zu. Dreh ihn langsam auf 0,8 und weiter auf 0,7. Miss am oberen Ende des Schwingkreises.

## Was du sehen solltest

- Auf 0,9 ist der schwache Sender kaum da: Im Ohrhörer ist kein Ton.
- Kurz hinter 0,8 springt die HF im Kreis hoch und ein Pfeifen beginnt, etwa 1 kHz.
- Weiter gedreht steigt das Pfeifen (etwa 2 kHz bei 0,75, fast 4 kHz bei 0,7).
- Die Tonhöhe des Pfeifens ist der Abstand zwischen dem Träger des Senders und der eigenen Schwingung der Schaltung.

## Warum es funktioniert

Der Kreis verliert in jeder Schwingung etwas Energie im Widerstand der Spule, in der Antenne und an der Basis des Transistors. Die Koppelwicklung gibt einen Teil des verstärkten Signals im Takt des Kreises zurück und deckt damit einen Teil dieser Verluste: Der Kreis wird schärfer und sein Signal größer. Kommt mehr zurück, als verloren geht, wächst jedes winzige Signal — der Sender oder sogar das Wärmerauschen der Spule —, bis dem Transistor die Verstärkung ausgeht. Das ist ein Oszillator nahe der Senderfrequenz. Zwei Signale mit nahe beieinander liegenden Frequenzen überlagern sich: Die Sperrschicht des Transistors hört ihren Unterschied als Ton. Steigt der Transistorstrom, zieht seine Kapazität die Schwingung ein wenig vom Sender weg, und das Pfeifen wird höher.
