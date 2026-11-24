# Hundertstel Millimeter mit Licht messen

Zwei Stücke Lichtleiter stoßen aneinander. Je schmaler der Spalt dazwischen, desto mehr Licht kommt hinüber, und ein Fototransistor mit einem NPN/PNP-Paar macht daraus eine Anzeige. Eine Spaltänderung dünner als ein Haar bewegt den Zeiger.

**Vermittelt:** Kopplungsverlust an einer Lichtleiter-Verbindung, berührungsloses Messen, das Komplementärpaar (Sziklai)

## Was zu tun ist

Klick auf **Sim** und dreh den Knopf des Lichtleiters langsam von 0 bis 0,5 mm. Beobachte das Messgerät.

## Was du sehen solltest

- Spalt geschlossen: etwa 7,9 V.
- 0,05 mm: schon mehr als ein halbes Volt weniger.
- 0,1 mm: etwa 6,4 V; 0,5 mm: etwa 2,8 V.

## Warum es funktioniert

Licht verlässt den ersten Lichtleiter als Kegel. Über einen breiteren Spalt wird der Kegel größer, und der zweite Lichtleiter fängt einen kleineren Teil davon auf. Der Strom des Fototransistors erzeugt eine Spannung an 47 kΩ, und das NPN/PNP-Paar gibt diese Spannung an das Messgerät weiter, fast ohne ihr Strom zu entnehmen.
