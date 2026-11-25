# Crate division / Kistenaufteilung

**EN.** Split 83 items into full crates of nine. Enter `020 PC RUN`. The program subtracts nine from the items left only when enough remain to fill another crate. Expect `P  035`, then `A00.002` on **ACC**. Cell 039 contains the remainder `00.002`, and cell 040 contains the quotient `00.009`. The run executes 90 teaching instructions, with no programmed delay. Base memory suffices. The program occupies 020–034 and 039–042 and needs no terminal connections.

**DE.** Verteile 83 Stück auf volle Kisten zu je neun Stück. `020 PC RUN` eingeben. Das Programm zieht neun Stück ab, solange der Vorrat für eine weitere volle Kiste reicht. Am Ende erscheint `P  035`, mit **ACC** dann `A00.002`. Zelle 039 enthält den Rest `00.002`, Zelle 040 den Quotienten `00.009`. Der Ablauf umfasst 90 Lehrbefehle ohne programmierte Wartezeit. Der Grundspeicher genügt. Belegt sind 020–034 und 039–042. Externe Anschlüsse sind nicht erforderlich.
