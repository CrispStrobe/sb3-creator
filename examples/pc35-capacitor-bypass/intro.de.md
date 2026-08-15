---
level: intermediate
age: 12+
prereqs: [pc06-rc-charge, pc01-led-resistor]
teaches: [bypass-capacitor, decoupling, charge-reservoir, parallel-circuit]
---

## Was du siehst

Einen Widerstand und eine LED — das kennst du schon — und dazu einen Kondensator,
der quer über der LED hängt und sonst nirgendwohin führt. Er liegt nicht im Weg
des Stroms. Er liegt daneben.

## Probier das aus

1. Klick auf **Sim**. Die LED leuchtet mit **2,97 mA** — genau so viel, wie
   dieser Widerstand mit dieser LED auch allein zustande brächte.
2. Rechne nach: (5 V − 2,03 V) ÷ 1000 Ω = 2,97 mA. Der Kondensator trägt zu
   dieser Rechnung nichts bei.
3. Sieh dir die erste halbe Sekunde genau an. Die LED springt nicht an, sondern
   kommt über ein paar hundert Millisekunden hoch, während der Kondensator sich
   füllt.
4. Ändere `cap` von `0.00047` (470 µF) auf `0.0000001` (100 nF), die Größe, die
   auf echten Platinen sitzt, und schau noch einmal. Die Verzögerung ist weg: zu
   schnell zum Sehen.
5. Lösch den Kondensator ganz. Am Messwert im eingeschwungenen Zustand ändert
   sich überhaupt nichts.

## Was dahintersteckt

Schritt 5 ist das Verwirrende an dieser Schaltung, also fang damit an: Im
eingeschwungenen Zustand tut der Kondensator nichts. Sobald er auf dieselbe
Spannung wie die LED geladen ist, fließt weder Strom hinein noch heraus, und die
Schaltung verhält sich, als wäre er nicht da.

Kondensatoren reagieren nur auf *Änderungen*. Dieser hier ist ein kleiner
örtlicher Ladungstank, direkt neben der Last geparkt. Will die Last plötzlich
mehr Strom, als die Versorgung durch den Widerstand der Leitungen liefern kann,
leert sich der Tank ein wenig und überbrückt die Lücke; sinkt der Bedarf wieder,
füllt er sich nach. Das alles passiert schneller, als die Versorgung reagieren
kann — und genau darum geht es: Der Kondensator ist näher an der Last als das
Netzteil.

Schritt 3 ist dieselbe Physik in der Gegenrichtung: Beim Einschalten muss der
Strom erst den Kondensator füllen, bevor die LED ihren Anteil bekommt, das
Einschalten wird also weichgezeichnet. Mit 470 µF kannst du dabei zusehen.
Schritt 4 zeigt, was eine echte Platine macht: 100 nF liefern dasselbe Verhalten
im Mikrosekundenbereich, und dort spielt sich Digitaltechnik ab. Ein Logikchip,
der seine Ausgänge umschaltet, reißt für ein paar Nanosekunden eine scharfe
Stromspitze — und ohne Kondensator in der Nähe zieht diese Spitze die ganze
Versorgungsschiene mit nach unten, was der Nachbarchip als Störung liest.

Deshalb heißt das Bauteil auch **Abblockkondensator**: Es koppelt die
Stromspitzen eines Bauteils von der Versorgung aller anderen ab.

## Warum das wichtig ist

Sieh dir irgendeine Platine mit einem Chip an: Innerhalb eines Zentimeters neben
jedem Versorgungspin sitzt ein kleiner Kondensator. Meist sind sie zahlreicher
als alles andere auf der Platine. Mit dem Messgerät kann man ihre Wirkung nicht
sehen, in der Schaltungsbeschreibung werden sie nie erwähnt — und Platinen, die
ohne sie gebaut wurden, fallen sporadisch auf eine Art aus, die einen tagelang
suchen lässt.

## Wie es weitergeht

- **Vorher, falls noch nicht:** [pc06-rc-charge](../pc06-rc-charge) — warum es
  dauert, einen Kondensator zu füllen.
- **Zum Vergleich:** [pc29-capacitor-discharge](../pc29-capacitor-discharge) —
  dieselbe gespeicherte Ladung, absichtlich verbraucht statt in Reserve
  gehalten.
- **Als Nächstes:** [pc21-rc-smoothing](../pc21-rc-smoothing) — dieselbe Idee,
  groß genug, um eine ganze Versorgung zu glätten.
- **Zum Ausprobieren:** Häng den Kondensator stattdessen in *Reihe* zur LED
  (Kathode an den Kondensator, Kondensator an Masse) und lass es laufen. Die LED
  leuchtet kurz und geht dann endgültig aus, denn ein geladener Kondensator
  sperrt Gleichstrom. Dieser eine Draht ist der Unterschied zwischen Abblocken
  und Blockieren — und genau das war vor der Prüfung der Fehler dieses Beispiels.
