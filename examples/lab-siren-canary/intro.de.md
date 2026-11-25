# Sirene und Kanarienvogel: eine langsame Rampe verschiebt einen Ton

Der Ton einer Sirene steigt und fällt; ein Kanarienvogel zwitschert immer wieder nach oben. Beides ist ein Tongenerator, dessen Tonhöhe von einem viel langsameren Oszillator verschoben wird.

**Vermittelt:** spannungsgesteuerter Oszillator, Modulation, Rampe und Sägezahn

## Was zu tun ist

Klick auf **Sim** und hör zu. Schieb dann **MODE** auf Kanarienvogel. **SOUND** schaltet den Ton aus und ein.

## Was du sehen solltest

- Sirene: Der Ton gleitet auf und ab, etwa anderthalbmal pro Sekunde.
- Kanarienvogel: schnelle Zwitscher nach oben, jeder beginnt wieder unten.

## Warum es funktioniert

Ein langsamer OPV-Oszillator lädt und entlädt einen großen Kondensator; dessen Spannung ist eine langsame Rampe. Ein zweiter Operationsverstärker streckt sie und gibt sie auf die Basiswiderstände eines Transistor-Multivibrators, des Tongenerators. Je höher diese Spannung, desto schneller erholen sich die Kondensatoren des Multivibrators nach jedem Umkippen, und desto höher der Ton. Im Kanarienvogel-Modus leert eine Diode den langsamen Kondensator fast sofort, die Rampe steigt also nur: ein Zwitschern.
