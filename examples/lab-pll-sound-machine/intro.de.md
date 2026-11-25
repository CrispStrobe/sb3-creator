# Klangmaschine: Der PLL-Oszillator trillert und heult

Eine Spielzeug-Klangmaschine: Ein langsamer Oszillator verwackelt die Steuerspannung des Oszillators in einem PLL-Baustein. Wähle ein Rechteck, und der Ton springt zwischen zwei Noten; wähle ein Dreieck, und er gleitet wie eine Sirene.

**Vermittelt:** Frequenzmodulation, der Integrator, spannungsgesteuerte Oszillatoren

## Was zu tun ist

Klick auf **Sim** und hör auf den Piezo. Schließ den Modulationsschalter. Stell dann den Schiebeschalter von Rechteck auf Dreieck. Dreh am Tonhöhen-Potentiometer, um den ganzen Klang höher oder tiefer zu schieben.

## Was du sehen solltest

- Schalter offen: ein gleichmäßiger Ton.
- Rechteck: ein schnelles Trillern zwischen etwa 500 und 790 Hz.
- Dreieck: eine Sirene, die zwischen etwa 470 und 710 Hz gleitet.

## Warum es funktioniert

Die Tonhöhe des VCO folgt seiner Steuerspannung. Der LM386-Oszillator erzeugt ein Rechteck, das zwischen zwei Spannungen springt, also springt der Ton zwischen zwei Noten. Der Integrator mit dem Operationsverstärker macht aus dem Rechteck ein Dreieck: Er steigt gleichmäßig, solange das Rechteck hoch ist, und fällt, solange es tief ist. So steigt und fällt der Ton weich. Synthesizer erzeugen ihre Klänge genauso.
