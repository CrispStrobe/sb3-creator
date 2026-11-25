# Instruction patch / Befehlswechsel

**EN.** Cell 069 starts as `04.014`. Enter `066 PC RUN` to copy the full instruction word `04.197` from cell 078 to cell 069 and jump to it. Expect `P  071`, then `A00.197` on **ACC**, and `C04.197` after `069 OUT`. Reload the listing to see the original word again. The run executes five teaching instructions, with no programmed delay. Base memory suffices. The program occupies 066–070 and 078 and needs no terminal connections.

**DE.** Zu Beginn steht `04.014` in Zelle 069. Mit `066 PC RUN` kopiert das Programm das vollständige Befehlswort `04.197` aus Zelle 078 nach Zelle 069 und springt dorthin. Am Ende erscheint `P  071`, mit **ACC** dann `A00.197`. Nach `069 OUT` erscheint `C04.197`. Erneutes Laden stellt das ursprüngliche Wort wieder her. Der Ablauf umfasst fünf Lehrbefehle ohne programmierte Wartezeit. Der Grundspeicher genügt. Belegt sind 066–070 und 078. Externe Anschlüsse sind nicht erforderlich.
