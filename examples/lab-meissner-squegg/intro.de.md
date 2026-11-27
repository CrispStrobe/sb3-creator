# Ein Oszillator, der sich selbst ein- und ausschaltet

Ein Meißner-Oszillator auf einem Ferritstab erzeugt einen Mittelwellenträger, und ein Detektorempfänger 22 cm entfernt hört zu. Der Transistor stellt seinen Arbeitspunkt selbst ein: Je stärker er schwingt, desto mehr richtet seine Basis gleich, und die Ladung, die das auf dem Basis-Speicherkondensator hinterlässt, regelt ihn wieder herunter. Ein Schiebeschalter legt einen großen Kondensator parallel zum Emitterwiderstand; zwei weitere Schalter können die Koppelwicklung umpolen.

**Vermittelt:** Phasenbedingung eines Oszillators, Selbstvorspannung, Pendeln (sich selbst unterbrechende Schwingung)

## Was du tun kannst

Klicke auf **Sim** und warte einige zehn Millisekunden. Schalte dann den **großen Emitterkondensator** zu und höre in den Ohrhörer. Schalte ihn wieder ab. Lege zum Schluss **beide Koppelschalter** um.

## Was du beobachten kannst

- Großer Kondensator ab: Der Sender schwingt gleichmäßig (sein Schwingkreis schwingt mit etwa 8,5 V); der Empfänger bekommt einen gleichmäßigen Träger, der Ohrhörer bleibt still.
- Großer Kondensator zu: Die Schwingung setzt immer wieder ein und aus, etwa tausendmal in der Sekunde. Der Ohrhörer brummt mit einem Ton um 1 kHz: Der Träger ist mit einem Ton getastet.
- Mit umgepolter Wicklung schwingt gar nichts.

## Warum das so ist

Solange er schwingt, richtet der Transistor seine eigene Ansteuerung gleich: Der Basisstrom lädt den Speicherkondensator an der Basis negativ auf und regelt den Transistor damit herunter. Wieder aufgeladen wird der Speicher nur langsam, über 0,7 MΩ. Mit dem kleinen Emitterkondensator hält der 1-kΩ-Emitterwiderstand die Verstärkung der Stufe beim Träger in Grenzen: Jeder Anlauf schießt nur wenig über, und Schwingung und Vorspannung stellen sich gemeinsam auf eine Größe ein. Mit dem großen ist die volle Verstärkung da. Jeder Anlauf schießt so weit über, dass der gleichgerichtete Strom den Speicher weit über den Sperrpunkt hinaustreibt, und die Schwingung erstirbt. Erst wenn sich der Speicher wieder aufgeladen hat, etwa eine Millisekunde später, setzt sie wieder ein. Umgepolt koppelt die Wicklung das Gegenteil dessen zurück, was der Schwingkreis tut, sodass jeder Anlauf ausgelöscht wird.
