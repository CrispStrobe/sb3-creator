# Elektronischer Münzwurf

Halte den Taster gedrückt, und ein LM386-Oszillator flackert schneller zwischen Rot und Grün, als du sehen kannst. Lass los, und er bleibt schlagartig stehen, auf Rot oder auf Grün. Welche Farbe es wird, hängt vom genauen Moment des Loslassens ab, den du nicht steuern kannst: Kopf oder Zahl.

**Vermittelt:** Hysterese, Oszillator gegenüber Speicher (bistabile Kippstufe), ein Transistor als Inverter

## Was zu tun ist

Klick auf **Sim**. Halte den Taster einen Moment gedrückt und lass ihn dann los. Wiederhole das einige Male und zähl Rot und Grün.

## Was du sehen solltest

- In Ruhe: Grün.
- Während du drückst: Beide LEDs scheinen zu leuchten (sie flackern etwa 170-mal pro Sekunde).
- Nach dem Loslassen: Eine LED bleibt an, Rot oder Grün, bis zum nächsten Wurf.

## Warum es funktioniert

Der Verstärker schaltet mit Hysterese: Er kippt erst oberhalb einer Spannung nach oben und erst unterhalb einer niedrigeren nach unten. Bei losgelassenem Taster liegt sein Minus-Eingang genau dazwischen, also bleibt jeder Zustand bestehen: ein Speicher. Der Taster schaltet einen Kondensator zu, den der Ausgang selbst lädt und entlädt; dann pendelt der Minus-Eingang über beide Schaltpunkte, und die Schaltung schwingt. Der Transistor schaltet die grüne LED aus, sobald der Ausgang hoch ist, deshalb leuchtet immer genau eine LED.
