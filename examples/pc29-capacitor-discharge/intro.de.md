---
level: intermediate
age: 12+
prereqs: [pc06-rc-charge, pc01-led-resistor]
teaches: [capacitor, energy-storage, rc-time-constant, discharge, diode-forward-voltage]
---

## Was du siehst

Einen Kondensator mit je einem Schalter links und rechts. Der linke verbindet ihn
mit der 5-V-Quelle, der rechte mit einer LED. Beide werden nie gleichzeitig
gebraucht — diese Schaltung hat zwei getrennte Aufgaben, und du erledigst sie
nacheinander.

## Probier das aus

1. Klick auf **Sim**. Schließe `charge` und lass `discharge` offen. Sieh zu, wie
   die Kondensatorspannung steigt: 0,48 V nach 0,1 s, 3,16 V nach 1 s, 4,72 V
   nach etwa 3 s.
2. Öffne jetzt `charge` — die Quelle ist damit weg — und schließe `discharge`.
3. Die LED leuchtet, mit **2,44 mA**, gespeist allein vom Kondensator.
4. Beobachte, wie sie schwächer wird: 1,49 mA nach einer halben Sekunde, 0,91 mA
   nach einer, 0,05 mA nach vier. Dem Kondensator geht der Vorrat aus.
5. Sieh dir am Ende die Kondensatorspannung an. Sie bleibt bei etwa **2 V**
   stehen und will nicht weiter herunter.

## Was dahintersteckt

Ein Kondensator besteht aus zwei Metallflächen, die sich nicht berühren. Schiebst
du Ladung auf die eine, bleibt sie dort — festgehalten von der Anziehung zur
entgegengesetzten Ladung auf der anderen Seite. Diese gespeicherte Ladung *ist*
die Energie, und sie bleibt liegen, bis du ihr einen Weg nach draußen gibst.

Das Laden dauert, weil der Strom sich durch den 1-kΩ-Widerstand zwängen muss —
und es wird immer zäher, je voller der Kondensator ist, denn dann bleibt immer
weniger Spannung zum Drücken übrig. Widerstand mal Kapazität ergibt die
**Zeitkonstante**: 1000 Ω × 0,001 F = 1 Sekunde. Nach einer Zeitkonstante ist der
Kondensator zu etwa 63 % geladen, nach fünf so gut wie voll. Schritt 1 zeigt es:
3,16 V von 5 V nach genau 1 s.

Spannend ist die zweite Hälfte. In Schritt 2 ist die Quelle abgetrennt — die
Leitung dorthin ist tatsächlich offen — und die LED leuchtet trotzdem. Nichts
erzeugt hier Energie; der Kondensator *gibt zurück*, was du kurz vorher
hineingesteckt hast, und betreibt die LED an seiner eigenen sinkenden Spannung.

Schritt 5 lohnt sich zu merken. Das Verlöschen endet bei etwa 2 V, nicht bei
0 V. Das ist die Flussspannung der LED: Darunter leitet sie einfach nicht mehr,
der Entladeweg schließt sich also praktisch selbst, und die restliche Ladung
bleibt gefangen. Ein Kondensator, der sich in einen einfachen Widerstand
entlädt, läuft glatt gegen null; einer, der sich in eine Diode entlädt, stößt auf
einen Boden und bleibt dort liegen.

## Warum das wichtig ist

Hier hört "ausgesteckt ist sicher" auf zu stimmen. In Blitzgeräten, Netzteilen
und Motorsteuerungen sitzen nach dem Ziehen des Steckers geladene Kondensatoren
— manche mit hunderten Volt, und sie warten geduldig auf dich. Genau deshalb
gibt es in Geräten **Entladewiderstände**: ein absichtlicher langsamer Weg, der
den Kondensator leer laufen lässt, sobald der Strom weg ist.

## Wie es weitergeht

- **Vorher, falls noch nicht:** [pc06-rc-charge](../pc06-rc-charge) — die
  Ladekurve für sich allein, ohne dass eine LED das Ende verbiegt.
- **Als Nächstes:** [pc43-bleeder-discharge](../pc43-bleeder-discharge) — der
  Sicherheitswiderstand, der den Kondensator für dich leert.
- **Danach:** [pc35-capacitor-bypass](../pc35-capacitor-bypass) — derselbe
  Speichertrick, diesmal zum *Stabilisieren* einer Versorgung.
- **Zum Ausprobieren:** Ersetze die LED durch eine einfache Verbindung von
  `rload.b` nach Masse und schau dir die Entladung noch einmal an. Jetzt läuft
  sie glatt bis ganz nach unten, mit derselben Zeitkonstante von 1 s — weil
  niemand mehr einen 2-V-Boden einzieht.
