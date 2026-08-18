# Keyshow: eine 4×4-Matrixtastatur an einer 7-Segment-Ziffer

Drücke eine Taste auf dem roten Tastenfeld — ihr Wert (0–F) erscheint
auf der Ziffer. Das ist der echte Matrix-Scan, keine Abkürzung: Das
Programm zieht eine Zeile nach der anderen auf LOW und liest die vier
Spalten zurück — exakt die Schleife, die auf dem Silizium des Prechin
A2 lief. Die Pinbelegung ist die am A2 vermessene: Zeilen an P1.7–P1.4,
Spalten an P1.3–P1.0, Segmente an P0.

Im SIM-Modus ist das Tastenfeld klickbar: Ein Druck verbindet Zeile und
Spalte elektrisch (0,1 Ω), und der Scan findet ihn genauso, wie echte
Firmware einen echten Finger findet.
