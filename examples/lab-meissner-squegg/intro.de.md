# Ein Oszillator, der sich selbst ein- und ausschaltet

Ein Meißner-Oszillator auf einem Ferritstab erzeugt einen Mittelwellenträger, und ein Detektorempfänger einen halben Meter entfernt hört zu. Der Transistor stellt seinen Arbeitspunkt selbst ein: Je stärker er schwingt, desto mehr Strom zieht er, und die Spannung, die dieser Strom am Emitterkondensator hinterlässt, regelt ihn wieder herunter. Ein Schiebeschalter legt dort einen viel größeren Kondensator dazu; zwei weitere Schalter können die Koppelwicklung umpolen.

**Vermittelt:** Phasenbedingung eines Oszillators, Selbstvorspannung, Pendeln (sich selbst unterbrechende Schwingung)

## Was du tun kannst

Klicke auf **Sim** und warte einige zehn Millisekunden. Schalte dann den **großen Emitterkondensator** zu und höre in den Ohrhörer. Schalte ihn wieder ab. Lege zum Schluss **beide Koppelschalter** um.

## Was du beobachten kannst

- Großer Kondensator ab: Der Sender schwingt gleichmäßig (sein Schwingkreis schwingt mit etwa 9 V); der Empfänger bekommt einen gleichmäßigen Träger, der Ohrhörer bleibt still.
- Großer Kondensator zu: Die Schwingung setzt immer wieder ein und aus – etwa achthundertmal in der Sekunde. Der Ohrhörer brummt mit einem Ton um 0,8 kHz: Der Träger ist mit einem Ton getastet.
- Mit umgepolter Wicklung schwingt gar nichts.

## Warum das so ist

Solange er schwingt, richtet der Transistor seine eigene Ansteuerung gleich, zieht mehr Strom und lädt den Emitterkondensator auf, was ihn herunterregelt. Mit dem kleinen Kondensator geschieht das in einer Mikrosekunde, viel schneller als die Schwingung wachsen oder abklingen kann, sodass sich beide gemeinsam auf eine Größe einstellen. Mit dem großen dauert es eine Millisekunde: Die Schwingung ist längst angewachsen, bevor die Vorspannung nachkommt; dann schießt die Vorspannung über das Ziel hinaus und sperrt den Transistor, die Schwingung erstirbt, und erst wenn sich der Kondensator entladen hat, setzt sie wieder ein. Umgepolt koppelt die Wicklung das Gegenteil dessen zurück, was der Schwingkreis tut, sodass jeder Anlauf ausgelöscht wird.
