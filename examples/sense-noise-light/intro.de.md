---
level: intermediate
age: 10+
prereqs: [03-night-light, 14-traffic-light]
teaches: [sound-level, peak-detection, thresholds]
---
## Was du siehst
Eine Ampel für Lärm. Der analoge Ausgang des Geräuschmoduls sagt dem MCU, wie laut es im Raum ist: Grün für ruhig, Gelb für lebhaft und Rot für zu laut. Praktisch im Klassenzimmer oder in der Werkstatt, damit alle merken, wenn der Lärm langsam steigt.

## Probier das
1. Starte das Programm und schiebe den Geräuschpegel langsam von 0 nach oben. Grün wird zu Gelb und dann zu Rot.
2. Finde die Reglerstellungen, an denen die Farbe wechselt, und vergleiche sie mit 400 und 700 im Programm (der Messwert reicht von 0 bis 1023).
3. Drücke Klatschen, während der Regler niedrig steht. Erreicht ein einzelnes kurzes Klatschen Rot? Das sollte es, denn das Programm behält den größten seiner 20 Messwerte.

## Was passiert hier
Der analoge Ausgang des Moduls ist eine Spannung proportional zum Geräuschpegel, deshalb liest der ADC sie direkt — anders als beim LDR braucht es keinen Spannungsteiler. Echter Schall ist eine schnelle Welle, die hunderte Male pro Sekunde auf und ab schwingt; ein einzelner Messwert kann irgendwo auf dieser Welle landen. 20 Messwerte zu nehmen und nur den größten (die Spitze) zu behalten, ergibt eine ruhige Antwort.

Zwei Schwellen teilen den Bereich in drei Bänder, und das verschachtelte WENN/SONST sorgt dafür, dass genau eine LED leuchtet.

## Warum das wichtig ist
Spitzenwerterkennung steckt in Schallpegelmessern, in der Eingangsanzeige eines Gitarrenstimmgeräts oder in einem VU-Meter. Eine Messung in wenige klare Bänder einzuteilen, macht Daten auf einen Blick lesbar.

## Weiter geht's
- [sense-noise-counter](../sense-noise-counter) — Geräusche stattdessen mit dem digitalen Ausgang zählen.
- [16-ldr-bargraph](../16-ldr-bargraph) — eine Messung in mehr Stufen anzeigen.
- Experiment: Lass Rot nach der letzten lauten Spitze noch zwei Sekunden an, damit kurze Ausbrüche besser auffallen.
