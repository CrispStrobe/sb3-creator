# Die Steuermatrix — der Teil, der entscheidet

Stelle einen Opcode ein, takte dann durch die sechs Zeitschritte und sieh zu, wie die Steuerleitungen der Reihe nach feuern. T1 legt den Programmzähler auf den Bus (Ep, Lm), T2 zählt weiter (Cp), T3 holt den Befehl (CE, Li) — so weit ist es für jeden Befehl gleich. Ab T4 übernimmt der Opcode: LDA lädt den Akku aus dem Speicher, ADD führt über das B-Register und den Addierer, SUB genauso mit gesetztem Su, OUT kopiert den Akku in das Ausgaberegister. Jede Lampe hier ist ein UND-Term, verodert mit den anderen, die dieselbe Leitung treiben. Mehr ist ein fest verdrahtetes Steuerwerk nicht — und genau dieses Teil macht aus Registern, Speicher und Addierer einen Computer.

**Vermittelt:** Fest verdrahtete Steuerung, UND-ODER-Matrix, der Hol-und-Ausführ-Zyklus

## Was zu tun ist

Stelle die DIP-Schalter und beobachte die Ausgänge. Der Aufbau braucht 5 Steckbretter — echter Logik gehen die Löcher schnell aus.

Jeder Chip bekommt +5 V und GND — ein IC ohne Versorgung tut nichts, und ein offener Eingang tut Schlimmeres: er liest, was der Raum gerade macht. Genau das verhindern die 10-kΩ-Pulldowns.

## Was du sehen solltest

| instruction | state | lines asserted |
|---|---|---|
| any | T1 | Ep, Lm |
| any | T2 | Cp |
| any | T3 | CE, Li |
| LDA | T5 | CE, La |
| ADD | T6 | Eu, La |
| SUB | T6 | Eu, La, Su |
| OUT | T4 | Ea, Lo |
