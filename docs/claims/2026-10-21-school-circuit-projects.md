# School circuit projects — SOURCE CANDIDATE

Owner: Codex circuit-projects, isolated lane/school-circuit-projects-20261021.
Base d7c258910dd3837021a7a8c4b85d38a4e28e138a.

Own three new examples school-miniorgan-107056, school-intercom-101455 and
school-led-people-dog, their entries in examples/index.json and derived
example compatibility fields, focused example topology/roundtrip tests and
this claim. Transcribe the OPITEC/Winkler manufacturer topology and preserve
the user's explicitly rewired AA variant as a separate design.

Electrical dynamics must be qualified against matched SPICE models upstream;
never replace the transistor oscillator with a prescribed tone. Document
model assumptions, microphone test injection and acoustic limits. Keep failed
or unqualified simulation status explicit until producer fixes land. No compiler,
translation, existing-example or workflow changes. Lite adopts these files
through its existing immutable sb3-creator sync after normal upstream landing.
Merge this claim before source implementation.

Claim dd16f40e landed before source. Five topology controls and 321 canonical
roundtrip controls pass with actual bw-board and bw-circuit-ui models (326
total, no skips). Matched electrical dynamics and native scope/audio proof
are qualified in bw-board PR663 and bw-circuit-ui PR102. Consumer adoption
requires those supplier revisions. Physical acoustics remain unqualified.
