# 6502 + 80×32 CRTC-Text

Öffne das Beispiel und wähle den Controller. Das ROM programmiert den MC6845
über $4000/$4001 und schreibt Zeichencodes ab $3000 ins RAM. Ein Pluszeichen
markiert jede Ecke, einschließlich der letzten Zelle.

[65C02-Assembler](main.s) · [Linker-Konfiguration](rom.cfg)
