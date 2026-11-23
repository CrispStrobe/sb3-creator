# Was eine Solarzelle kann und was nicht

Eine einzelne Solarzelle liefert gut ein halbes Volt und einen Strom, der mit dem Licht wächst. Belastet man sie mit verschiedenen Widerständen, erhält man ihre Kennlinie; irgendwo in der Mitte gibt sie die meiste Leistung ab. Zu schwach, um allein einen Transistor einzuschalten, schafft sie es, wenn sie auf eine kleine Vorspannung nur noch den Rest draufsetzen muss.

**Vermittelt:** Photovoltaik, Strom-Spannungs-Kennlinie, Punkt maximaler Leistung, Vorspannung

## Was zu tun ist

Klick auf **Sim**. Dreh am Lastpoti von Zelle 1 und notiere Spannung und Strom bei mehreren Stellungen, schalte dann die Last ab. Ändere das Licht der Zellen von dunkel bis voll. Leg den Vorspannungsschalter von Zelle 2 um.

## Was du sehen solltest

- Die Spannung bleibt über einen weiten Lichtbereich bei 0,5 bis 0,6 V; der Strom ändert sich stark.
- Die meiste Leistung bei einer mittleren Last, nicht an den Enden.
- Die grüne LED leuchtet schon bei sehr wenig Licht, aber nur mit Vorspannung.
- Der Lüfter dreht sich erst bei gutem Licht.

## Warum es funktioniert

Licht setzt in der Zelle Ladungsträger frei; das ergibt einen Strom, der proportional zum Licht ist. Die Zelle ist zugleich eine Diode, und diese Diode begrenzt die Spannung auf etwa 0,6 V, egal wie hell es wird. Bei kleiner Last nimmt die Diode den Strom weg, bei großer Last bricht die Spannung ein. Die Basis eines Transistors braucht etwa 0,65 V, bevor er leitet, etwas mehr als eine Zelle liefert. Deshalb liefert der Teiler den größten Teil und die Zelle den Rest.
