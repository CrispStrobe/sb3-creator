---
level: intermediate
age: 12+
prereqs: [gpio]
teaches: [8086, 8255-ppi, port-io, gpio]
---
## Was du siehst
Eine von acht LEDs blinkt einmal pro Sekunde ein und aus. Die Platine ist eine Intel-8086-CPU, verbunden mit einem 8255 (Programmable Peripheral Interface, PPI); die acht LEDs hängen an Port B des 8255. Das Programm treibt nur das unterste Bit, `P2.0`, sodass LED 0 blinkt, während die anderen sieben dunkel bleiben.

## Probier das aus
1. Starte das Programm und sieh zu, wie LED 0 mit 1 Hz blinkt.
2. Die anderen sieben LEDs (`P2.1`–`P2.7`) sind der Rest desselben 8255-Ports. Ändere `PIN led = P2.0 OUTPUT` in `PORT leds = P2 OUTPUT`, dann `turn on led` in `set leds to 255` und `turn off led` in `set leds to 0` — jetzt blinken alle acht gemeinsam.
3. Von dort aus lässt `set leds to 1`, `set leds to 2`, `set leds to 4` … ein einzelnes gesetztes Bit über den Port wandern — ein klassisches 8255-Ausgabe-Beispiel.

## Was passiert hier
Der 8086 hat keine eigenen GPIO-Pins; er erreicht die Außenwelt über seinen Bus. Der 8255 sitzt auf diesem Bus als I/O-adressierter Port-Baustein: Die CPU schreibt ein Byte an die Adresse von Port B des 8255, und diese acht Bits erscheinen an den acht Pins von Port B. `PIN led = P2.0` benennt Bit 0 dieses Ports, und `turn on`/`turn off` setzen und löschen es. So trieb jeder frühe PC seine Peripherie an — der 8255 saß auf der Hauptplatine des ursprünglichen IBM PC.

## Warum das wichtig ist
Es ist dasselbe Blinken wie bei jeder anderen Platine hier, aber es zeigt das Eine, was den 8086 besonders macht: Die Ausgabe läuft über einen Port-Baustein auf dem Bus, nicht über einen Pin an der CPU. Zu verstehen, dass der 8255 ein eigenständiges adressierbares Gerät ist, ist der Schlüssel zu allem anderen, was man an einen 8086 anschließen kann.
