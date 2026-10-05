---
level: intermediate
age: 11+
prereqs: [clock-ds3231, eeprom-start-counter]
teaches: [buses, loops, addresses]
---
## Was du siehst
Der serielle Monitor listet jeden Chip auf, der am I2C-Bus antwortet — „device at 80“ und „device at 104“ — und dann, wie viele es waren. Die Lampe leuchtet, wenn mindestens einer geantwortet hat.

## Probier das
1. Welcher Chip hat die 80 und welcher die 104? (Tipp: Sieh dir die beiden anderen Beispiele an.) Meist schreibt man diese Zahlen hexadezimal: 0x50 und 0x68.
2. Entferne die Uhr aus dem Programm (lösche ihre PART-Zeile). Was findet der Scanner jetzt?
3. Lass die Lampe für jeden gefundenen Chip einmal blinken.

## Was dahintersteckt
Jeder Chip an einem I2C-Bus hört auf seine eigene 7-Bit-Adresse, eine Zahl von 1 bis 127. Um mit einem zu sprechen, beginnt das Programm eine Übertragung und schickt die Adresse; der Chip mit dieser Adresse antwortet, indem er die Datenleitung einen Taktimpuls lang auf LOW zieht — das „Acknowledge“. Zieht niemand, bleibt die Leitung HIGH, und niemand ist zu Hause.

`i2c device a on bus` macht genau das für die Adresse `a`, und das REPEAT probiert alle 127. Die Zeile `PART bus = I2C …` benennt nur die zwei Leitungen; die Uhr und der Speicherchip hängen an denselben zwei.

## Warum das wichtig ist
Wenn ein neuer Sensor nicht funktioniert, lautet die erste Frage: „Ist er überhaupt da?“ Ein solcher Scanner ist das erste Werkzeug, zu dem man greift — und der Adressplan eines Busses ist das, was Dutzende Chips sich zwei Leitungen teilen lässt.

## Weiter geht's
- [clock-ds3231](../clock-ds3231) — der Chip mit der 104.
- [eeprom-start-counter](../eeprom-start-counter) — der Chip mit der 80.
- Experiment: Gib die Adressen hexadezimal aus.
