# UND und ODER aus Transistoren

**Vermittelt:** Logikgatter, NAND, NOR, Inverter

## Was zu tun ist

Klick auf **Sim**. Drück Taster A (button_3), dann B (button_4), dann beide zusammen. Schau auf die grüne und die gelbe LED.

## Was du sehen solltest

- Grün (UND) leuchtet nur, wenn du beide Taster drückst.
- Gelb (ODER) leuchtet, wenn du einen der Taster drückst oder beide.

## Warum es funktioniert

Zwei Transistoren übereinander leiten nur, wenn beide eingeschaltet sind: Ihr Ausgang wird nur dann low, wenn A und B gedrückt sind, ein NAND. Zwei nebeneinander leiten, wenn einer von beiden an ist: ein NOR. Ein PNP-Transistor hinter jedem Gatter macht aus „low“ ein „LED an“: Aus NAND wird UND, aus NOR wird ODER.
