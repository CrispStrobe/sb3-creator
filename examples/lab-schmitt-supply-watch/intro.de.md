# Schmitt-Trigger als Batteriewächter

Eine Warnleuchte, die angeht, wenn die Batterie schwach wird — und nicht flackert, solange die Spannung um die Grenze herumpendelt, weil sie erst bei deutlich höherer Spannung wieder ausgeht.

**Vermittelt:** Schmitt-Trigger, Hysterese, Batterieüberwachung

## Was zu tun ist

Klick auf **Sim**. Dreh das **Poti** langsam auf 0,45 herunter und wieder hoch und beobachte die gelbe LED. Stell es dann auf 0,6 und senke die Spannung der **Batterie** schrittweise auf 7 V und wieder auf 9 V.

## Was du sehen solltest

- Die LED geht bei einer Potistellung an und erst bei einer höheren wieder aus.
- Mit der Batterie: an unter etwa 7,25 V, wieder aus erst über etwa 8,25 V.

## Warum es funktioniert

Beide Transistoren teilen sich einen Emitterwiderstand. Übernimmt Q2, hebt er die gemeinsame Emitterspannung weniger an als vorher Q1, deshalb braucht Q1 dann eine höhere Basisspannung, um zurückzugewinnen. LED und Dioden im Eingang ziehen fast feste 2,6 V vom Batterieanteil des Potis ab, also bekommt Q1 bei schwächerer Batterie überproportional weniger Spannung.
