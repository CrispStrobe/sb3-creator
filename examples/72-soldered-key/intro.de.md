# Die festgelötete Taste

Diese Platine kam so aus der Fertigung zurück — und etwas stimmt nicht:
**die LED leuchtet, obwohl niemand die Taste drückt.**

Die Schaltung oben ist in Ordnung — prüfe sie in der Schaltplan-Ansicht.
Die Platine darunter nicht. Öffne die **Platinen-Ansicht (▦)** und schau
auf den Findings-Chip: Die Prüfung, die diese Fehlerklasse findet, heißt
*Terminal-Kurzschluss*. Ein 6×6-Taster hat vier Beine, aber nur **zwei**
Anschlüsse: Die beiden Beine auf jeder Seite sind innen ein Stück Metall.
Führt eine Masseleitung ans falsche Bein, ist die Taste dauerhaft
gedrückt verdrahtet — das Kupfer sieht harmlos aus, der Schaltplan ist
korrekt, und das Multimeter piept erst, wenn der Taster eingelötet ist.

Finde das Pad mit dem falschen Netz, und prüfe dann: mit welchem anderen
Pad ist es intern verbunden? Genau darum leuchtet die LED.

Das ist eine echte Fehlerklasse: Die Platine, der diese Lektion
nachempfunden ist, hatte sechs davon — und jede war eine tote Taste.
