# Three-transistor intercom — expected behavior

Sources: [Winkler PRINT 101455 amplifier](https://www.winklerschulbedarf.com/Documents/Anleitungen_Werkpackungen/PDF_Ger/101455.pdf) and [101450 intercom](https://www.winklerschulbedarf.com/Documents/Anleitungen_Werkpackungen/PDF_Ger/101450.pdf).

R1–R11 and C1–C7 preserve the manufacturer's connections and values. Volume is 100 kΩ; its initial position is halfway. Optional microphone supply U remains externally unused. Three explicit exponential NPN cards represent the physical BC337s, using illustrative IS=1e-14 A, BF=100, BR=1, N=1, RB=10 Ω, RC=1 Ω, CJE=10 pF, CJC=4 pF and TF=0.3 ns. These are not measured BC337 parameters.

Each speaker has 8 Ω electrical coil resistance and an explicit source representing generated acoustic emf. Acoustic-A initially injects a 1 mV peak, 1 kHz test tone; Acoustic-B is silent. This is an electrical stimulus, not live microphone capture, sound propagation or acoustic feedback.

DPDT-A and DPDT-B represent two poles of one mechanically linked switch. Keep both at 0 for A → B; set both to 1 for B → A. For B → A, also set Acoustic-A amplitude to 0 and Acoustic-B to 0.001 V. The editor exposes the poles separately.

Requires the bw-board charge repair (PR663). Probe the receiving speaker's coil terminals differentially. The physical startup has charging transients: allow coupling capacitors to settle before quoting steady gain. A separate DC-initialized comparison of the same amplifier gives 41.851× versus 41.817× in ngspice, with about 41 µV maximum output error across 801 samples. This qualifies the stated model, not real-kit gain or intelligibility.

Use sampled spectrum capture for waveform replay and WAV export (bw-circuit-ui PR102). The playback is a finite captured waveform with DC removed and fixed scaling, not a replacement oscillator.

Supplier qualification: bw-board PR663 implements the matched transistor charge and open-passive guards; bw-circuit-ui PR102 provides sample replay/WAV and PR103 preserves narrow captured pulses in the time display. The consumer must include their qualified revisions.
