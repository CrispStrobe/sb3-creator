# Original CP1 gallery exercises

The gallery has 13 independently written programs. The four earlier examples cover the first display, reading a switch, blinking an LED and the CP5-style binary workbench. The nine additional exercises cover arithmetic loops, quotient and remainder, indirect access, two-byte instruction replacement, Boolean terminal control, CP3 single-stepping, sample logging, Gray-code output and input dispatch.

The additional assembly and bilingual acceptance briefs originated in independent author commit `ed3cc5c`. The author received the hardware and behavior contract and the topics of the four existing Brickwright examples. The author wrote new data, control flow and instructional text. The gallery circuit layouts and UI-facing directions were added during integration. The historical manual listings and ROM remain external oracle fixtures and are absent from the gallery.

[Acceptance fixtures](cp1-independent-examples.json) describe 16 cases. To exercise them on the 8049/8155 machine with any compatible, explicitly supplied monitor image:

```sh
node scripts/verify-cp1-independent-examples.mjs --board ../bw-board /path/to/monitor.bin
```

Multiple ROM paths exercise the same sources and expectations on each firmware. The check uses physical keypad operations and observes display masks, teaching RAM and external ports.
