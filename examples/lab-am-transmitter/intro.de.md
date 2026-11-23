# AM-Prüfsender und ein Empfänger am anderen Ende des Tisches

Zwei Schaltungen auf einem Brett. Links ein Sender: Ein Transistoroszillator auf einem Ferritstab (der Schwingkreis im Kollektor, eine kleine Koppelwicklung, die die Basis im Takt speist) erzeugt einen Träger bei etwa 800 kHz, und ein zweiter Transistor, der den Strom des Oszillators zieht und von einem 1-kHz-Tonsignal gesteuert wird, lässt die Größe des Trägers dem Ton folgen — Amplitudenmodulation. Rechts ein Detektorempfänger auf einem zweiten Ferritstab, einen halben Meter entfernt: Das Magnetfeld des Senders erreicht seinen Stab, und er spielt den Ton.

**Vermittelt:** Oszillator + Modulator = Sender, magnetisches Nahfeld, warum ein solcher Sender nur ein paar Meter weit reicht

## Was zu tun ist

Klick auf **Sim** und hör in den Kristallohrhörer. Wähle dann den Ferritstab des Empfängers und ändere seinen Parameter `distanceM` von 0,5 auf 1 und 2 (Meter).

## Was du sehen solltest

- Bei 0,5 m trägt der Empfängerkreis ein Drittel Volt HF, und der 1-kHz-Ton ist deutlich da.
- Bei 1 m ist die HF ein Achtel davon (das Nahfeld fällt mit der dritten Potenz des Abstands) und der Ton fast weg; bei 2 m nichts.
- Dreht man einen der Stäbe, sodass sie nicht mehr parallel liegen, wird die Verbindung ebenfalls schwächer.

## Warum es funktioniert

Der Oszillator hält seinen Schwingkreis in Gang, indem er über die Koppelwicklung einen kleinen Teil seines Kollektorsignals zurückführt. Wie groß die Schwingung wird, hängt vom Strom ab, den der Transistor ziehen darf — und diesen Strom stellt der Modulatortransistor ein, dessen Basis dem Ton folgt. So schwillt der Träger tausendmal in der Sekunde an und ab. Nahe an einer Spule fällt ihr Magnetfeld mit eins durch Abstand hoch drei; ein Detektorempfänger hat keinen Verstärker, und seine Diode wird bei schwachem Signal ein schlechter (quadratischer) Gleichrichter, deshalb verschwindet der Ton noch schneller als die HF.
