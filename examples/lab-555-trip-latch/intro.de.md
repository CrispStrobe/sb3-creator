# Stolperdraht-Alarm, der an bleibt

Ein dünner Draht quer über die Tür. Reißt er, ertönt der Alarm – und er tönt weiter, auch wenn der Draht wieder verbunden wird. Nur die versteckte Reset-Taste stoppt ihn.

**Vermittelt:** Selbsthaltung, Speicher, Trigger und Reset des 555

## Was zu tun ist

Klick auf **Sim**. Öffne DRAHT (switch_5): der Draht reißt. Schließ ihn wieder. Drück dann RESET (button_8). Probier RESET noch einmal, während DRAHT offen ist.

## Was du sehen solltest

- Draht gerissen: die rote LED leuchtet, der Piezo tönt (etwa 680 Hz).
- Draht wieder verbunden: es tönt weiter.
- RESET: Ruhe – außer der Draht ist noch gerissen, dann kommt der Alarm beim Loslassen sofort zurück.

## Warum es funktioniert

Im 555 steckt ein Flipflop. Der Draht hält seinen Trigger-Eingang hoch; reißt er, fällt der Eingang ab und setzt das Flipflop: Der Ausgang geht auf High und schaltet den zweiten 555, den Ton, ein. Sein Schwellen-Eingang, der ihn sonst wieder abschalten würde, liegt an Masse, also kann ihn nur der Reset-Eingang löschen.
