# Pieptöne aus Logikgattern

Ein NAND-Gatter mit Schmitt-Trigger-Eingang, ein Widerstand und ein Kondensator sind schon ein Oszillator. Nimm einen langsamen und einen schnellen, und lass den langsamen den schnellen ein- und ausschalten: Aus dem Dauerton werden Pieptöne, wie bei einem Zeitzeichen oder einem Besetztton.

**Vermittelt:** Gatteroszillatoren, Torschaltung (ein Signal schaltet ein anderes), RC-Zeitglied

## Was zu tun ist

Klick auf **Sim** und hör zu. Beobachte die gelbe LED. Schiebe dann den Schiebeschalter nach rechts.

## Was du sehen solltest

- Die gelbe LED blinkt etwa zweieinhalbmal pro Sekunde.
- Bei jedem Blinken ein kurzer Ton von etwa 570 Hz, dazwischen Stille.
- Mit dem Schalter rechts: ein Dauerton.

## Warum es funktioniert

Der Ausgang des Gatters lädt den Kondensator über den Widerstand. Erreicht der Kondensator die obere Schaltschwelle, kippt der Ausgang und entlädt ihn, bis die untere Schaltschwelle ihn zurückkippt. Der Abstand zwischen den beiden Schwellen (die Hysterese) hält das Ganze in Gang. Ein NAND-Gatter gibt das nur weiter, solange sein anderer Eingang high ist; so wird der langsame Oszillator zum Ein-Aus-Schalter für den schnellen.
