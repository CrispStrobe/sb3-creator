# Klatsch an, klatsch aus

Einmal klatschen, und die Lampe geht an, noch einmal, und sie geht aus. Ein Lautsprecher hört zu, der Verstärker-Chip hebt das Klatschen an, und ein Flipflop merkt sich, ob die Lampe an sein soll.

**Vermittelt:** Mikrofonverstärker, Impulsformung, Kipp-Flipflop, Relais

## Was zu tun ist

Klick auf **Sim**. Schieb in der Instrumentenspalte den Regler **Schall** kurz auf 120 und zurück auf 0 (ein Klatschen). Warte einen Moment und klatsch noch einmal. Probier auch 70 (Sprechen).

## Was du sehen solltest

- Erstes Klatschen: Das Relais zieht an, die Lampe leuchtet.
- Zweites Klatschen: wieder aus.
- Sprechen: nichts.

## Warum es funktioniert

Ein Klatschen ist ein kurzer Stoß aus vielen Schwingungen. Dioden und Kondensator machen aus dem ganzen Stoß einen einzigen Spannungsimpuls, deshalb zieht der Transistor die Triggerleitung pro Klatschen nur einmal herunter. Jeder solche Impuls kippt das Flipflop, und dessen Zustand schaltet das Relais.
