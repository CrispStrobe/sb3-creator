# UKW auf der Flanke eines Schwingkreises hören

Ein UKW-Sender ändert nie seine Stärke: Er schwingt mit dem Ton in der Frequenz, hier 75 kHz zu beiden Seiten von 98 MHz im Takt eines 1-kHz-Tons. Ein Diodengleichrichter sieht nur die Stärke — außer der Schwingkreis davor ist ein wenig neben den Sender gestimmt. Dann sitzt der Träger auf der Flanke der Resonanzkurve, und jede Frequenzschwankung wird zu einer Schwankung der Größe.

**Vermittelt:** Frequenzmodulation, die Resonanzkurve, Umwandlung von FM in AM (Flankendemodulation)

## Was zu tun ist

Klick auf **Sim** und hör zu. Das Abstimmpoti stellt die Sperrspannung der Kapazitätsdiode und damit die Resonanz des Kreises ein. Probiere 0,46 (neben dem Sender), 0,48 (genau darauf) und 0,40 (weit weg).

## Was du sehen solltest

- Bei 0,46 liegt der Kreis etwa 0,9 MHz unter dem Sender: Der 1-kHz-Ton ist deutlich da.
- Bei 0,48 sitzt der Kreis fast auf dem Sender: Der Ton wird viel schwächer, weil die Spitze der Kurve flach ist.
- Bei 0,40 ist der Kreis einige MHz entfernt: Stille.
- Die HF am Kreis ändert sich kaum, während der Ton kommt und geht: Die Stärke des Senders ist konstant, es kommt nur darauf an, wo er auf der Kurve sitzt.

## Warum es funktioniert

Spule und Kapazitätsdiode bilden einen Schwingkreis bei etwa 100 MHz; die Kapazität der Diode sinkt, wenn ihre Sperrspannung steigt, und so stimmt das Poti ihn ab. Auf dem steilen Teil der Resonanzkurve gibt eine Frequenz etwas näher an der Spitze eine größere HF-Spannung, eine etwas weiter entfernte eine kleinere. Die FM-Schwankung lässt deshalb die HF-Spannung am Kreis im Takt des Tons steigen und fallen, und die Germaniumdiode gewinnt das zurück, genau wie in einem Mittelwellenempfänger. Echte UKW-Empfänger benutzen einen besseren Trick (einen Diskriminator), weil die Flanke weder gerade noch unempfindlich gegen Störungen ist, aber die Idee ist dieselbe.
