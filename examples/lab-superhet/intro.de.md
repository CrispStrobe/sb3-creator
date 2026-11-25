# Ein Superhet mit Mischer-IC

So arbeitet jedes gute Radio seit den 1930er-Jahren: Es verstärkt den Sender nicht auf seiner eigenen Frequenz, sondern setzt ihn zuerst auf eine feste Zwischenfrequenz (ZF) um, hier 455 kHz, wo ein scharfes Filter und ein Verstärker die Arbeit für jeden Sender erledigen.

**Lernziel:** Frequenzumsetzung im Mischer, die Zwischenfrequenz, Gleichlauf zweier Schwingkreise, die Spiegelfrequenz

## Was du tun kannst

Klicke auf **Sim** und höre: der 612-kHz-Sender. Drehe den Oszillatorknopf (den zweiten Drehkondensator) ein wenig: Der Sender ist weg, obwohl der Antennenknopf noch auf ihn zeigt. Probiere dann die beiden Schiebeschalter: **Lose** koppelt die Antenne über 10 pF an (den Antennenknopf ein wenig nachstimmen, auf etwa 0,53); **Tiefe ZF** zieht die ZF auf etwa 295 kHz herunter — stelle den Oszillatorknopf auf 0,30, und ein starker Sender auf 1200 kHz kommt jetzt zusammen mit 612 kHz herein.

## Was du beobachten kannst

- Beide Knöpfe wie eingestellt: der 400-Hz-Ton des 612-kHz-Senders.
- Oszillatorknopf leicht verdreht: Stille.
- Lose Kopplung: etwas leiser, und der Nachbarsender auf 810 kHz wird besser zurückgehalten.
- Tiefe ZF und Oszillator auf 0,30: der 1-kHz-Ton des 1200-kHz-Senders mischt sich dazu — die Spiegelfrequenz.

## Warum das so ist

Der Mischer-IC multipliziert den Sender mit seinem eigenen Oszillator. Im Produkt steckt ihre Differenzfrequenz, und nur wenn diese Differenz 455 kHz beträgt, erreicht sie die ZF-Spule, deren Schwingkreis nichts anderes durchlässt. Der Oszillator muss also immer eine ZF über dem Sender liegen: Die beiden Knöpfe müssen gemeinsam gedreht werden. Ein Sender eine ZF *über* dem Oszillator ergibt aber dieselbe Differenz — die Spiegelfrequenz. Bei 455 kHz ZF liegt das Spiegelbild von 612 kHz bei 1523 kHz, weit genug weg, dass der Antennenkreis es fernhält; bei tiefer ZF ist es nur 590 kHz entfernt, wo ein starker Sender sitzt und durchkommt.
