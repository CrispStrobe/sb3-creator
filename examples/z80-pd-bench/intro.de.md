---
level: advanced
age: 16+
prereqs: []
teaches: [z80-cpu, retro-computing, address-decoding, glue-logic]
---
## Was du siehst
Ein zweiter Z80-Breadboard-Computer — dieselbe CPU wie in `z80-bench`, aber die Antwort eines anderen Bastlers auf dieselbe Aufgabe. ROM unten im Speicher, RAM oben, und eine Handvoll kleiner Logikchips, die entscheiden, wer antwortet. Wo die andere Platine einen seriellen Baustein aus den 1980ern benutzt, um einen modernen Rechner zu erreichen, greift dieses Design zu einem USB-FIFO.

## Probier das
1. Verfolge A15 von der CPU aus. Die Leitung geht an genau zwei Stellen, und diese zwei Stellen sind die gesamte Speicheraufteilung: ein Gatter sagt "ROM", das andere sagt "RAM".
2. Zaehle die Gatter im Dekoder, dann die Draehte. Neun Signale hinein, drei Chip-Selects und drei Port-Strobes hinaus — das ist die komplette "Glue Logic" eines Computers.
3. Vergleiche das Ganze direkt mit `z80-bench`. Gleiche CPU, gleiche Busse, anderes I/O-Geraet — und sieh, wie viel diese eine Entscheidung veraendert und wie viel sie unberuehrt laesst.

## Was passiert hier
Eine CPU allein kann ROM nicht von RAM unterscheiden. Sie legt eine Adresse auf 16 Leitungen und zieht /MREQ auf Low, um zu sagen: "das ist Speicher". Etwas anderes muss daraus machen: "und deshalb soll *dieser* Baustein antworten". Hier ist dieses Etwas A15, das oberste Adressbit: Low heisst untere Haelfte der 64K, High heisst obere Haelfte. Ein Gatter verknuepft "Speicherzugriff" mit "A15 low" und aktiviert das ROM, ein zweites verknuepft ihn mit "A15 high" und aktiviert das RAM. Das ist die ganze Speicheraufteilung — zwei Gatter.

Die I/O-Seite funktioniert genauso, nur mit anderen Signalen. Der Z80 hat einen eigenen I/O-Adressraum, betreten mit /IORQ statt /MREQ und adressiert ueber das untere Adressbyte. Diese Maschine hat nur zwei Ports, also dekodiert sie gar nicht erst acht Adressbits — A0 allein unterscheidet sie. Gerade Portnummern sind Port 0, ungerade sind Port 1, und beim Schreiben wird A0 komplett ignoriert, weil es nur ein Ziel gibt. Eine bewusste Abkuerzung — und ein guter Anlass zu sehen, dass Adressdekodierung eine Entwurfsentscheidung ist und keine feste Regel.

Das serielle Geraet des Originals ist ein FTDI UM245R: ein USB-Baustein, der eine **Byte-Warteschlange** anbietet statt eines seriellen Ports. Der Erbauer waehlte ihn, nachdem ein FTDI-Kabel an einem klassischen 6850-UART Daten verloren hatte — der FIFO puffert stattdessen, und die CPU fragt einfach "ist ein Byte da?", bevor sie eines liest.

## Warum das wichtig ist
Zwei Bastler, eine CPU, zwei Maschinen. Der Bus ist derselbe, die Speicherdekodierung fast dieselbe, und das I/O-Geraet vollstaendig anders — und genau das ist Rechnerarchitektur: ein kleiner Satz gemeinsamer Konventionen plus ein Stapel lokaler Entscheidungen. Denselben Z80 zweimal zu sehen, auf zwei Arten verdrahtet, lehrt mehr als ihn einmal zu sehen.

## Weiter geht's
- [z80-bench](../z80-bench) — dieselbe CPU, aber mit einem MC6850-ACIA. Der Vergleich ist die Lektion.
- [eater6502-bench](../eater6502-bench) — eine andere klassische CPU, dieselben drei Fragen: was taktet sie, was erinnert sich, was spricht.
- Lies zuerst EXPECTED.md: diese Platine bildet die Maschine originalgetreu ab, aber fuer ihren USB-FIFO gibt es noch kein Bauteil in der Engine — der Computer startet also und kann nicht sprechen. Was echt ist und was fehlt, steht dort geschrieben statt versteckt zu sein.


## Stufe eins: Lampen und Schalter

Das klassische erste I/O jedes Searle-Nachbaus ist auf dem Board:
ein 74HC374-Latch treibt acht LEDs (`OUT (0),A`), ein 74HC244-Buffer
liest vier DIP-Schalter (`IN A,(0)`), beide per /IORQ mit /WR bzw.
/RD durch die ODER-Gatter gestrobt — ein Port, zwei Richtungen,
genau wie auf dem echten Steckbrett. Maschine bauen, Preset
**Switch Mirror** laden, Schalter umlegen.
