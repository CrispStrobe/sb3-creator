# Eine LED als Referenzspannung

**Vermittelt:** Transistorschalter, Referenzspannung, Schwelle

## Was zu tun ist

Klick auf **Sim** und dreh den Knopf (potentiometer_3) langsam von unten nach oben. Merk dir, wo die grüne LED angeht. Die rote LED leuchtet die ganze Zeit.

## Was du sehen solltest

- Im ersten Viertel des Drehwegs bleibt die grüne LED dunkel.
- Kurz nach einem Viertel geht sie an und ist bald ganz hell.

## Warum es funktioniert

Der Transistor leitet erst, wenn seine Basis etwa 0,6 V über dem Emitter liegt. Hier liegt der Emitter nicht an Masse, sondern auf der roten LED, die ihn bei etwa 1,7 V hält. Die Basis braucht also etwa 2,4 V, etwas mehr als ein Viertel der 9 V am Knopf.
