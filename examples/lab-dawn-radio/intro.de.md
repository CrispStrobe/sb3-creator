# Das Radio, das bei Tagesanbruch einschaltet

Ein Weckradio aus zwei bekannten Schaltungen: dem Ein-Transistor-Empfänger und einem Lichtschalter. Ein zweiter Transistor sitzt in der Masseleitung des Empfängers; ein lichtabhängiger Widerstand schaltet ihn ein, wenn Licht auf ihn fällt. Im Dunkeln ist das Radio aus und braucht fast keinen Strom; im Morgenlicht spielt es.

**Vermittelt:** Transistor als Schalter, Sensor und Verbraucher kombinieren, Ruhestrom

## Was zu tun ist

Klick auf **Sim**. Die Schaltung startet im Dunkeln: Der Ohrhörer ist still. Mach das Licht am LDR langsam heller und hör zu.

## Was du sehen solltest

- Dunkel: kein Ton, der Transistor des Empfängers führt keinen Strom.
- Hell: der 400-Hz-Ton des 612-kHz-Senders im Ohrhörer, so laut wie beim Ein-Transistor-Radio.
- Dazwischen gibt es einen kurzen Bereich, in dem der Schalter halb leitet und der Ton schwach ist.

## Warum es funktioniert

Der LDR und die 47 kΩ bilden an der Basis des Schalttransistors einen Spannungsteiler. Im Dunkeln hat der LDR etwa 1 MΩ, die Basis liegt nahe 0 V und der Schalter sperrt: Der Emitter des Empfängers hat keinen Weg nach Masse. Licht senkt den LDR auf etwa 1 kΩ, die Basis steigt über 0,7 V, der Schalter steuert durch und verbindet den Emitter des Empfängers mit Masse, und der Empfänger arbeitet wie gewohnt.
