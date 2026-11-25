# Durchlassprüfer mit 555-Ton

Ein Ton, der nur erklingt, wenn Strom von der roten Prüfspitze zur schwarzen fließen kann. Steck Dioden, eine LED und Transistoren in die Fassung und finde heraus, in welche Richtung sie leiten – und ob ein Transistor ein NPN oder ein PNP ist.

**Vermittelt:** Durchlassrichtung, NPN und PNP, der Reset-Pin des 555

## Was zu tun ist

Klick auf **Sim**. Drück jeweils eine Fassungstaste: die Diode (button_13), die rote LED (button_15), den NPN (button_17) oder den PNP (button_19). Schieb dann beide Klemmen-Schalter (slide_switch_11 und slide_switch_12) nach rechts, um die Prüfspitzen zu vertauschen, und probier es noch einmal. Halte zum Schluss die Diodentaste, schließ LECK (switch_21) und dreh am Regelwiderstand (potentiometer_23).

## Was du sehen solltest

- Prüfspitzen vorwärts: Diode, LED und NPN piepen, der PNP bleibt still.
- Prüfspitzen vertauscht: nur der PNP piept.
- LECK: Der Ton steigt von etwa 680 Hz auf etwa 980 Hz, wenn du den Regelwiderstand zudrehst.

## Warum es funktioniert

Der Tongenerator läuft nur, solange sein Reset-Pin High ist. Die schwarze Prüfspitze ist dieser Pin: Er wird nur High, wenn Strom von der roten Spitze durch das Bauteil fließt. Eine Diode lässt Strom von der Anode zur Kathode durch; beim NPN ist die Basis die Anodenseite, beim PNP die Kathodenseite. Ein Leck vom Steuereingang nach Masse senkt die Schaltspannungen des Timers, er schaltet früher und der Ton wird höher.
