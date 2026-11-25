# LED-Dimmer: ein Verstärker folgt dem Poti

Ein Poti kann eine Spannung einstellen, liefert aber kaum Strom: Eine LED direkt am Schleifer würde es belasten. Hier kopiert ein LM386-Leistungsverstärker die Spannung des Schleifers an seinen Ausgang und liefert den LED-Strom selbst. Sein Ausgang kommt nicht über etwa 8,1 V hinaus, deshalb kann die LED nie überlastet werden.

**Vermittelt:** Spannungsfolger (Ausgang auf den Minus-Eingang zurückgeführt), Grenzen des Ausgangshubs, ein Treiber für eine Last

## Was zu tun ist

Klick auf **Sim** und dreh das Poti langsam von einem Ende zum anderen. Beobachte die LED und das Voltmeter am Ausgang.

## Was du sehen solltest

- Die LED wird beim Aufdrehen gleichmäßig heller.
- Das Voltmeter folgt dem Poti dicht, bleibt aber bei etwa 8,1 V stehen, auch wenn das Poti 9 V liefert.
- Am unteren Ende des Potis ruht der Ausgang bei etwa 0,9 V, zu wenig für die LED: dunkel.

## Warum es funktioniert

Der Verstärker vergleicht seine beiden Eingänge und steuert den Ausgang, bis sie übereinstimmen. Weil der Minus-Eingang mit dem Ausgang verbunden ist, stimmen sie überein, wenn der Ausgang gleich dem Schleifer ist: Er folgt. Das Poti muss nur einen winzigen Eingangsstrom liefern; die Milliampere der LED kommen aus der Endstufe des Verstärkers.
