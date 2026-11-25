# Wärme stoppt den Blinker

Zwei Transistoren bilden einen Blinker, der genau an der Grenze des Funktionierens eingestellt ist. Der erste Transistor ist das Thermometer: Wärmst du ihn mit den Fingern oder heißem Wasser, leitet er etwas mehr, und das genügt, um die Schaltung über die Grenze zu kippen. Das Blinken hört auf; lässt du den Transistor abkühlen, beginnt es wieder.

**Vermittelt:** Transistor-Sperrschicht als Temperaturfühler (−2 mV/K), Arbeitspunkt, ein an die Grenze eingestellter Oszillator

## Was zu tun ist

Klick auf **Sim** und beobachte die blinkende LED. Stell den Temperaturregler von Transistor Q1 auf „heiß", warte einige Sekunden und stell ihn dann zurück auf „Raum". Probier auch „Eis" und das Trimmpoti, das die Grenze einstellt.

## Was du sehen solltest

- Bei Raumtemperatur: Die LED blinkt etwa 1,2-mal pro Sekunde.
- Heiß: Innerhalb weniger Sekunden hört das Blinken auf, und die LED bleibt dunkel.
- Zurück bei Raumtemperatur: Sie blinkt wieder.
- Eiskalt: Die LED leuchtet dauernd und blinkt nicht.

## Warum es funktioniert

Der Kondensator führt jede Änderung am zweiten Transistor zum ersten zurück, der sie wieder verstärkt: Das Paar kippt hin und her, aber nur, solange beide Transistoren verstärken können. Der Arbeitspunkt des ersten Transistors wird durch eine feste Spannung an seiner Basis eingestellt. Warmes Silizium braucht weniger Basisspannung, also leitet der warme Transistor mehr, hält den zweiten gesperrt, und die Schleife verliert ihre Verstärkung. Kaltes Silizium bewirkt das Gegenteil.
