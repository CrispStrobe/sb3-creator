# Schwellenprüfer für Übergänge mit einem Zwillingstransistor

Ein Transistor schaltet seine LED ein, wenn seine Basis etwa 0,6 V erreicht. Diese Schwelle stört, wenn man die Schwelle von etwas anderem messen will. Der Trick: Das Prüfpoti beginnt nicht bei 0 V, sondern auf der Basis-Emitter-Spannung eines zweiten, gleichen Transistors. Die beiden Schwellen heben sich auf, und ihre Temperaturdrift auch.

**Vermittelt:** Schwellspannungen von Silizium, Germanium und LEDs, Kompensation mit einem gleichen Übergang

## Was zu tun ist

Klick auf **Sim**. Der linke Schiebeschalter wählt den Bezug des Potis: den Zwillingstransistor (links) oder Masse (rechts). Die nächsten drei Schiebeschalter setzen einen Übergang vor den Anzeigetransistor: keinen, eine Germaniumdiode, eine rote oder eine grüne LED. Dreh jeweils das Prüfpoti langsam von 0 auf, bis die gelbe LED leuchtet, und lies das Voltmeter ab. Zieh dann die **Temperatur**-Regler beider Transistoren auf 70 °C und miss noch einmal.

## Was du sehen solltest

- Zwillingsbezug: ohne Übergang leuchtet die LED fast sofort (etwa 0,04 V); Germaniumdiode etwa 0,12 V; rote LED etwa 1,3 V; grüne LED etwa 1,6 V.
- Massebezug: alles etwa 0,67 V höher, weil jetzt die Schwelle des Anzeigetransistors mitgemessen wird.
- Bei 70 °C: die Werte mit Zwillingsbezug bleiben; der mit Massebezug sinkt um etwa 90 mV.

## Warum es funktioniert

Beide Transistoren sind gleich gebaut und führen ähnliche Ströme, also sind ihre Basis-Emitter-Spannungen gleich und ändern sich gleich mit der Temperatur (etwa −2 mV pro Grad). Sitzt das Poti auf der Spannung des Zwillings, schaltet der Anzeigetransistor genau dann ein, wenn das Voltmeter die Schwelle dessen überstrichen hat, was dazwischen liegt. Wegen der winzigen Prüfströme zeigen die LEDs weniger als ihre üblichen 2 V.
