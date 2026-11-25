# Logikgatter aus Operationsverstärkern

Vier Operationsverstärker, zwei Taster, zwei LEDs: UND, NAND, ODER und NOR, alles aus Komparatoren.

**Vermittelt:** Logikgatter, Komparatoren, Pufferstufen

## Was zu tun ist

Klick auf **Sim**. Mit MODE (slide_switch_15) links probierst du alle vier Kombinationen von A (button_4) und B (button_7) und beobachtest die grüne und die rote LED. Dann schieb MODE nach rechts und probier sie noch einmal.

## Was du sehen solltest

- MODE links: Grün nur, wenn beide Taster gedrückt sind (UND); sonst Rot (NAND).
- MODE rechts: Grün, wenn mindestens ein Taster gedrückt ist (ODER); Rot nur, wenn keiner gedrückt ist (NOR).

## Warum es funktioniert

Zwei Spannungsfolger kopieren die Tasterleitungen, zwei Widerstände bilden ihren Mittelwert; der Mittelwert sagt, wie viele Taster gedrückt sind. Ein Komparator fragt „liegt der Mittelwert über der Referenz?“, der andere fragt das Gegenteil. Eine hohe Referenz braucht beide Taster, eine niedrige nur einen.
