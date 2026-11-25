# Kosmos CP1 experiments

Open **Examples → Codex → Kosmos CP1 experiments** in Circuit Designer. The trail covers sections 1.16–1.77 and 2.1–2.25 of the historical course as topic references. Its 87 stations use 35 new listings, 27 guided investigations, and the earlier original gallery exercises. Four additional activities cover a two-board serial link, triggered capture, a fixed-point filter, and a CP2 cassette data logger. The serial activity provides a listing and a local switch bench for each end, plus a linked-machine test.

The independent author received the topic map and a factual behavior contract. The author wrote the assembly, example data, setup text, and declarative cases. The provenance fields in [the case manifest](cp1-curriculum-programs.json) and [the lab manifest](cp1-guided-labs.json) record the authoring revisions. The gallery uses original circuits and teaching notes. The [coverage matrix](cp1-curriculum-coverage.json) records the mapping to each historical section.

The conveyor bench shows enable and direction on LEDs. The voltmeter bench uses switches to provide raw ADC codes and exercises the conversion and calibration logic. The cassette activity requires a CP2-capable monitor and CP3 memory. It uses the host cassette deck and the panel's `CAS` and `CAL` keys.

Run the 67 cases on the real emulated CPU and gallery circuits with independently obtained monitor images:

```sh
node scripts/verify-cp1-curriculum.mjs \
  --board ../bw-board --circuit-ui ../bw-circuit-ui \
  --extended --report /tmp/cp1-curriculum.json \
  /path/to/independent-monitor.bin /path/to/authorized-historical-monitor.bin
```

The runner loads the assembly, uses the monitor keypad, and compares the teaching RAM, accumulator, port latches, and display operations. The extended checks link two independently running CP1 machines and save the sample logger to WAV before loading the entire 512-byte image on a fresh CP3 machine. The reference monitor images and historic manual listings stay outside the example corpus.
