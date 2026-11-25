# Funk-Fernschalter

Links ein kleiner Sender: ein Transistoroszillator auf einem Ferritstab, der nur läuft, solange du seinen Taster hältst. Rechts, einen halben Meter entfernt, ein Empfänger: ein zweiter Ferritstab, ein MOSFET, der die Hochfrequenz verstärkt, eine Diode, die aus dem Träger eine Gleichspannung macht, und der Verstärkerchip, der diese Spannung anhebt, bis eine LED leuchtet.

**Vermittelt:** Trägererkennung, HF-Verstärkung, ein gleichspannungsgekoppelter Verstärker als Schalter

## Was zu tun ist

Klick auf **Sim** und warte einen Moment. Halte den **Taster** des Senders und beobachte die LED; lass dann los.

## Was du sehen solltest

- Ohne Taster bleibt die LED dunkel; der Ausgang des Verstärkers ruht bei der halben Betriebsspannung, etwa 4,5 V.
- Mit gehaltenem Taster leuchtet die LED nach wenigen Millisekunden: Der Ausgang steigt auf etwa 7 V.
- Lass los, und sie geht wieder aus.

## Warum es funktioniert

Auf diesem Träger liegt kein Programm — dass er da ist, ist schon die Nachricht. Der MOSFET des Empfängers verstärkt die HF etwa zwölffach, die Diode lädt ihren Kondensator auf die Spitzen des Trägers, und der Verstärkerchip mit direkt gekoppeltem Eingang multipliziert diese Gleichspannung mit 20, zusätzlich zu seiner Ruhelage bei der halben Betriebsspannung. Die LED sitzt hinter einer Z-Diode, also reichen die 4,5 V in Ruhe nicht, sie zum Leuchten zu bringen; der angehobene Ausgang schon.
