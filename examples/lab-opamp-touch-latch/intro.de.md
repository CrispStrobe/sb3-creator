# Berührungsflächen setzen und löschen einen OPV-Speicher

Berühr die eine Fläche, und ein rotes Licht geht an und bleibt an; berühr die andere, und es geht aus. Ein Operationsverstärker, der seinen Ausgang auf den eigenen Plus-Eingang zurückführt, merkt sich, welche Fläche zuletzt berührt wurde.

**Vermittelt:** Komparator, Mitkopplung, bistabiler Speicher, hoher Eingangswiderstand

## Was zu tun ist

Klick auf **Sim**. Drück kurz **SET** (ein Finger überbrückt das erste Flächenpaar), danach **RESET**.

## Was du sehen solltest

- Am Anfang leuchtet die grüne LED.
- Nach SET leuchtet die rote LED, auch nachdem du loslässt.
- Nach RESET leuchtet wieder die grüne.

## Warum es funktioniert

Der Minus-Eingang liegt fest auf 3 V. Der Plus-Eingang hängt über 10 MΩ am eigenen Ausgang: Ein hoher Ausgang hält Plus über 3 V, ein tiefer darunter, also hält sich jeder Zustand selbst. Dein Finger (etwa 1 MΩ) reicht trotzdem, um Plus über die Schwelle zu ziehen, weil in einen OPV-Eingang fast kein Strom fließt.
