# Speicher — sechzehn Plätze für eine Zahl

Der Zähler aus C1 treibt jetzt die ADRESS-Pins eines 74LS189, eines 16×4-Bit-RAMs. Gelbe LEDs zeigen, welche Adresse gerade anliegt, grüne, was dort steht. Daten einstellen, WRITE pulsen, weitertakten — so wurden die ersten Rechner von Hand programmiert. ACHTUNG: Der 74LS189 hat INVERTIERTE Ausgänge. Speichere 5 und die LEDs zeigen 10. Das ist der echte Chip, kein Fehler — deshalb sitzt in SAP-1-Aufbauten hinter dem RAM ein Inverter.

**Vermittelt:** Adresse gegen Daten, Programm von Hand laden, die invertierten Ausgänge des 74LS189

## Was zu tun ist

Stelle die DIP-Schalter und beobachte die Ausgänge. Der Aufbau braucht 3 Steckbretter — echter Logik gehen die Löcher schnell aus.

Jeder Chip bekommt +5 V und GND — ein IC ohne Versorgung tut nichts, und ein offener Eingang tut Schlimmeres: er liest, was der Raum gerade macht. Genau das verhindern die 10-kΩ-Pulldowns.

## Was du sehen solltest

| action | what you see |
|---|---|
| store 5 | LEDs read 10 (inverted!) |
| store 0 | LEDs read 15 |
| clock | address advances |
