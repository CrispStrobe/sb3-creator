# Hall-Umschalter mit Hysterese und ein Magnet, der eine PLL stimmt

Ein linearer Hall-Sensor liefert eine Spannung, die dem Feld des Magneten folgt. Zwei Transistoren machen daraus einen Umschalter, der sich merkt, welcher Pol zuletzt da war, und der Oszillator eines PLL-Bausteins macht aus derselben Spannung eine Tonhöhe.

**Vermittelt:** Hysterese, der emittergekoppelte Trigger, magnetische Pole, ein spannungsgesteuerter Oszillator

## Was zu tun ist

Klick auf **Sim**. Stell das Feld des Hall-Sensors auf −0,6 und erhöhe es dann schrittweise über 0, 0,2, 0,3 bis 0,6. Senk es dann schrittweise über 0, −0,3 bis −0,4. Hör dabei auf den Piezo.

## Was du sehen solltest

- Feld −0,6: Die grüne LED leuchtet.
- Steigend: Bei etwa +0,3 übernimmt die gelbe LED.
- Fallend: Gelb bleibt über 0 hinweg an und wechselt erst bei etwa −0,4 zu Grün.
- Die Tonhöhe steigt mit dem Feld: etwa 160 Hz bei −1, 580 Hz bei 0, 1010 Hz bei +1.

## Warum es funktioniert

Die beiden Transistoren teilen sich einen Emitterwiderstand. Der leitende bestimmt die Spannung daran, und die Basis des anderen muss sie überwinden. Weil die beiden Ströme verschieden sind, liegt das Feld, das auf Gelb schaltet, höher als das Feld, das zurückschaltet: Die Schaltung hat Hysterese und flackert nicht, wenn das Feld in der Nähe einer Schwelle schwankt. Der Oszillator des PLL-Bausteins lädt seinen Kondensator umso schneller, je höher seine Eingangsspannung ist, also folgt die Tonhöhe dem Feld.
