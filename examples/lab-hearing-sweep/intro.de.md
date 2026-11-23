# Wie hoch hörst du? Ein Tonsweep bis 20 kHz

Junge Ohren hören bis etwa 20 kHz, mit dem Alter sinkt die Grenze. Dieser 555-Tongenerator fährt beim Drehen am Knopf von einem deutlichen Pfeifen bis an den Rand des Hörbaren. Hör dort auf, wo der Ton für dich verschwindet, und lies die Frequenz ab.

**Vermittelt:** Frequenz und Hörbereich des Menschen, einen RC-Oszillator abstimmen, Kondensatoren umschalten, um den Bereich zu wechseln

## Was zu tun ist

Klick auf **Sim** und dreh den Knopf langsam von 0 bis zum Anschlag, während du auf den Piezo hörst. Merke dir, wo der Ton verschwindet. Schalte auf den tiefen Bereich und probiere es noch einmal von unten.

## Was du sehen solltest

- Hoher Bereich: etwa 2,8 kHz bei 0, bis fast 20 kHz am Anschlag.
- Tiefer Bereich: etwa 0,5 bis 3,6 kHz.
- Irgendwo weit oben wird der Ton unhörbar, und zwar für dich persönlich.

## Warum es funktioniert

Der 555 lädt und entlädt einen kleinen Kondensator über die Widerstände. Weniger Widerstand heißt schnelleres Laden und ein höherer Ton; der zusätzliche 10-nF-Kondensator bremst alles etwa um den Faktor fünf. Der Browser kann nur Töne bis etwa zur halben Abtastrate wiedergeben, ganz oben solltest du deshalb der Frequenzanzeige vertrauen.
