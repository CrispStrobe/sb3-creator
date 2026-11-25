# Operationsverstärker-Zwitschern: vom Küken zur Krähe

Ein Ton, dessen Höhe immer wieder nach oben gleitet: ein Zwitschern. Ein langsamer Sägezahn stellt die Tonhöhe eines spannungsgesteuerten Oszillators aus Operationsverstärkern ein. Schnelle Sägezähne klingen wie piepsende Küken, langsame wie eine lang ansteigende Krähe.

**Vermittelt:** spannungsgesteuerter Oszillator, Sägezahn, Klangeffekte

## Was zu tun ist

Klick auf **Sim** und hör zu. Schieb dann SLOW (slide_switch_10) nach rechts und wieder zurück.

## Was du sehen solltest

- Etwa elf Zwitscherer pro Sekunde; jeder gleitet von einem tiefen Brummen bis auf etwa 750 Hz und fällt sofort zurück. Die grüne LED (led_28) leuchtet, während ein Zwitscherer ansteigt.
- SLOW: etwa einmal pro Sekunde ein langer, ansteigender Ruf.

## Warum es funktioniert

Der erste Operationsverstärker erzeugt einen Sägezahn: Sein Kondensator lädt sich langsam auf und wird über eine Diode schnell entladen. Der zweite verstärkt ihn zu einer Steuerspannung, die von fast null bis 7 V läuft. Die letzten beiden Operationsverstärker und ein Transistor bilden einen Oszillator, dessen Kondensator mit Strömen geladen und entladen wird, die zu dieser Steuerspannung proportional sind: doppelte Spannung, doppelte Tonhöhe. SLOW gibt dem Sägezahn einen zehnmal größeren Kondensator.
