# Ein UKW-Superhet

Ein Radio für den UKW-Rundfunk arbeitet wie ein Mittelwellen-Superhet, nur hundertmal höher: Ein Oszillator 10,7 MHz über dem Sender mischt ihn auf eine feste Zwischenfrequenz herunter, wo ein Keramikfilter ihn heraussucht und ein UKW-ZF-Chip seine Frequenzschwankungen wieder in Ton verwandelt.

**Lernziel:** UKW-Superhet, Abstimmen mit Kapazitätsdioden, die 10,7-MHz-ZF und ihr Keramikfilter, Begrenzung und FM-Demodulation

## Was du tun kannst

Klicke auf **Sim** und höre in den Ohrhörer: Der Sender auf 98 MHz spielt einen 1-kHz-Ton. Drehe das **Abstimmpoti**: Der Ton ist weg; bei etwa 0,75 ist er wieder da.

## Was du beobachten kannst

- Abstimmpoti auf 0,75: ein sauberer 1-kHz-Ton.
- Abstimmpoti woanders: Stille (oder das Rauschen der ZF zwischen den Sendern).

## Warum das so ist

Die Abstimmspannung sperrt zwei Kapazitätsdioden, eine im Antennenkreis und eine im Oszillatorkreis; das Poti ändert beide Kapazitäten zugleich, sodass der Oszillator immer etwa 10,7 MHz über dem bleibt, worauf der Antennenkreis abgestimmt ist. Der Mischer-Chip multipliziert den Sender mit dem Oszillator, und nur ihre Differenz – 10,7 MHz – passiert das Keramikfilter. Der ZF-Chip verstärkt sie, bis sie begrenzt wird, was jede Amplitudenänderung beseitigt, und vergleicht dann ihre Phase mit einer Kopie über einen Schwingkreis: Das Ergebnis folgt der Frequenz, und die Frequenz eines UKW-Senders trägt sein Programm.
