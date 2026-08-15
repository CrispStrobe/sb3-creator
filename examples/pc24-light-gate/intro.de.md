---
level: advanced
age: 12+
prereqs: [pc23-transistor-switch, pc02-voltage-divider]
teaches: [ldr, sensor-divider, threshold, base-bias]
---

## Was du siehst

Ein lichtabhängiger Widerstand (LDR) führt von der 5-V-Schiene hinunter zu
einem 10-kΩ-Widerstand, der an Masse geht. Der Punkt, an dem sie sich treffen,
liegt an der Basis eines NPN-Transistors, und der Transistor schaltet eine
gelbe LED. Für die Helligkeit gibt es einen Schieberegler — diese Schaltung
will *bewegt* werden, nicht nur betrachtet.

> **Bekannter Fehler (15.08.2026):** Die LED-Seite dieses Beispiels
> funktioniert noch nicht — die Simulationsengine kennt für den NPN keine
> Sättigung, also läuft der Kollektor davon, statt zu schalten, sobald der
> Transistor angeht. Die **Sensor**-Seite ist korrekt und messbar, und mit der
> arbeiten die Schritte unten. Siehe `examples/AUDIT/pc13-pc24.md`.

## Probier das aus

1. Stell den Lichtregler auf **0** (dunkel) und miss die Spannung an der Basis.
   Etwa **0,45 V**.
2. Schieb ihn auf **1** (hell) und miss noch einmal: etwa **0,74 V**.
3. Das ist der ganze Bereich — keine 0,3 V — und die Schwelle des Transistors
   liegt mittendrin, bei etwa 0,7 V. Irgendwo auf halbem Weg des Reglers ändert
   die Schaltung also ihre Meinung.
4. Such diesen Punkt: Probier 0,1, dann 0,2, dann 0,3, und beobachte, wie die
   Basisspannung 0,70 V überquert.
5. Ändere jetzt den 10-kΩ-Widerstand auf **2,2 kΩ** und wiederhol Schritt 4.
   Der Umschaltpunkt wandert, weil du verändert hast, an welcher Stelle des
   LDR-Bereichs der Teiler ausgeglichen ist.

## Was dahintersteckt

Ein LDR ist ein Widerstand, der *kleiner* wird, wenn Licht auf ihn fällt.
Dieser reicht von etwa 100 kΩ im Dunkeln bis etwa 1 kΩ bei hellem Licht — hundert
zu eins. Aber ein Transistor kann keinen Widerstand lesen, er liest eine
Spannung. Irgendetwas muss das umrechnen, und dieses Etwas ist der
**Spannungsteiler**.

Der LDR ist das obere Glied, die 10 kΩ das untere, und der Knoten dazwischen
steht auf 5 V × (10 k) ÷ (R_LDR + 10 k). Im Dunkeln sind das 5 × 10/110 =
**0,45 V**. Bei hellem Licht wären es 5 × 10/11 = 4,5 V — nur klemmt die Basis
des Transistors bei etwa 0,7 V und lässt nicht mehr zu, weshalb Schritt 2
0,74 V zeigt und nicht 4,5.

Also: dunkel heißt Basis unter 0,7 V und Transistor aus. Hell heißt, der Teiler
drückt deutlich über 0,7 V, die Basis klemmt dort, und der Transistor ist an.
**Licht schaltet ein, Dunkelheit schaltet aus** — das folgt daraus, dass der LDR
das *obere* Glied ist. Vertausch LDR und 10 kΩ, und das Ganze kehrt sich um; und
genau so baut man eine Lampe, die bei Einbruch der Dämmerung angeht.

Schritt 5 ist der Entwurfsknopf. Den festen Widerstand zu ändern verschiebt die
Schwelle, weil der Teiler dort ausgeglichen ist, wo R_LDR in seiner
Größenordnung liegt. Wähl den festen Widerstand nahe dem LDR-Wert *bei der
Helligkeit, bei der ausgelöst werden soll*, und der Umschaltpunkt landet, wo du
ihn haben wolltest. Mehr ist die Methode nicht, und sie funktioniert genauso
für Temperatur (NTC), Feuchte, Kraft — für jeden Sensor, dessen Ausgang ein
Widerstand ist.

## Warum das wichtig ist

Fast jeder billige Sensor in einem Anfängerset ist ein Widerstand, der sich mit
irgendetwas ändert, und fast keiner kann von allein etwas antreiben. Dieses
Muster aus Teiler und Schwelle macht daraus eine Entscheidung. Straßenlaternen,
Nachtlichter, automatische Hintergrundbeleuchtungen, die
"Ist-der-Deckel-offen?"-Erkennung im Drucker — alles dieselben drei Bauteile.

## Wie es weitergeht

- **Als Nächstes:** [pc48-ldr-comparator](../pc48-ldr-comparator) — derselbe
  Sensor mit einem Komparator statt eines nackten Transistors, was eine viel
  schärfere und besser vorhersagbare Schwelle ergibt.
- **Danach:** [pc55-ntc-indicator](../pc55-ntc-indicator) — dieselbe Schaltung,
  die Temperatur misst.
- **Außerdem:** [16-ldr-bargraph](../16-ldr-bargraph) — derselbe LDR, von einem
  Programm als *Zahl* gelesen statt als Ein-aus-Entscheidung.
- **Zum Ausprobieren:** Die Schwelle des Transistors ist unscharf — irgendwo um
  0,7 V, und sie wandert mit der Temperatur — deshalb blendet diese Schaltung
  ein, statt zu schnappen. Überleg dir, was ein Komparator daran ändern würde,
  bevor du pc48-ldr-comparator öffnest, und prüf dann, ob du recht hattest.
