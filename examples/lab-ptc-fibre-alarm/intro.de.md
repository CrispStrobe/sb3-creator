# Ein Temperatur-Grenzalarm über einen Lichtleiter

Eine Warnung aus der Ferne: Wird ein Silizium-PTC-Fühler wärmer als eine eingestellte Grenze, schaltet eine LED ein, ein Lichtleiter trägt ihr Licht fort, und am anderen Ende startet ein Fototransistor einen Ton. Elektrisch ist nichts zwischen den beiden Enden verbunden.

**Vermittelt:** Komparatoren, optische Trennung, Fernalarme

## Was zu tun ist

Klick auf **Sim**. Nimm den Regler **Temperatur** des Fühlers in der Instrumentenspalte und erhöhe sie von Raumtemperatur auf heißes Wasser. Das Einstell-Potentiometer verschiebt die Grenze.

## Was du sehen solltest

- Raumtemperatur: alles ruhig, die Sende-LED ist dunkel.
- Über etwa 36 °C: Die LED leuchtet, und der Piezo am anderen Ende ertönt.

## Warum es funktioniert

Der LM386 vergleicht die Spannung des Fühlers mit der eingestellten Spannung und schaltet mit einer Verstärkung von 200 ganz in die eine oder andere Richtung. Sein Ausgang lässt die LED leuchten. Am Empfänger macht der Fototransistor aus dem Licht wieder einen Strom, der ein Transistorpaar einschaltet, und dieses versorgt den Tonoszillator. Weil zwischen den beiden Hälften nur Licht reist, kann ein Fehler oder eine hohe Spannung auf einer Seite die andere nicht erreichen.
