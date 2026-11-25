# LEDs am Klang unterscheiden

Ein Tongenerator aus Operationsverstärkern, dessen Tonhöhe der Differenz zwischen der Durchlassspannung einer LED und einem Knopf folgt. Stell den Knopf so ein, dass der Ton bei der roten LED verstummt; dann schalte auf die grüne und hör hin — ihre höhere Durchlassspannung bringt den Ton zurück.

**Vermittelt:** Durchlassspannung von LEDs, Spannungs-Frequenz-Wandler, Nullabgleich

## Was zu tun ist

Klick auf **Sim**, die rote LED steckt (slide_switch_5 links). Dreh NULL (potentiometer_9) langsam auf, bis der Ton verstummt; voltmeter_22 zeigt dann etwa null. Jetzt schieb den Schalter auf die grüne LED.

## Was du sehen solltest

- Rot: ein tiefer Ton, der beim Aufdrehen von NULL tiefer wird und verstummt.
- Grün, gleiche Knopfstellung: ein deutlicher Ton von etwa 800 Hz.

## Warum es funktioniert

Der Ausgang des Integrators läuft umso schneller abwärts, je weiter die LED-Spannung über der Knopfspannung liegt; jedes Mal, wenn er die untere Schwelle erreicht, wirft ihn der Komparator wieder nach oben — das ist eine Schwingung des Tons. Keine Differenz, kein Ablaufen, kein Ton. Eine grüne LED braucht etwa 0,3 V mehr als eine rote, um zu leiten; deshalb kommt der Ton zurück.
