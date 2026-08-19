---
level: anfaenger
age: 8+
prereqs: []
teaches: [variablen, bedingungen, ausdruecke, steuerfeld, oled-anzeige]
---
## Was du siehst
Ein Taschenrechner mit 17 Tasten (0-9, + - * / = C .) und einem
OLED-Display. Tippe eine Rechnung ein und druecke = fuer das Ergebnis.

## Probiere das
1. Klicke **Im Simulator ausfuehren**, um den Rechner zu starten.
2. Druecke 1, +, 2, dann = — das Display zeigt "1 + 2" und "= 3".
3. Druecke C zum Loeschen und probiere eine Multiplikation: 6 * 7 =.
4. Versuche mehrere Operationen: 10 + 20 - 5 =.

## Was passiert hier
Jede Taste ist ein Widget im Steuerfeld, das an eine Scratch-Variable
gebunden ist. Beim Druecken wird die Variable auf 1 gesetzt. Das Programm
prueft jede Variable, haengt das Zeichen an den Ausdruck an und setzt die
Variable auf 0 zurueck. Das OLED-Display liest die Variable `oled_text`
und stellt sie als Textzeilen dar — ein 128x64-OLED, abstrahiert als
4 Zeilen mit je 21 Zeichen.
