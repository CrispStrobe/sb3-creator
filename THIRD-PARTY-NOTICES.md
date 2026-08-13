# Third-Party Notices

sb3-creator is MPL-2.0 (see LICENSE). The BASIC code generation and
reading modules reference the following interpreters' dialects:

## BBC BASIC — zlib

`generateBASIC` (profile `'bbc'`) and `basicToPseudocode` emit and read
source text compatible with **BBC BASIC** by R.T. Russell.

BBC BASIC (Z80) and PicoBB (the C/Pico port) are copyright
(c) R.T. Russell, distributed under the **zlib licence**. The name
"BBC BASIC" is used by permission of the BBC, granted to R.T. Russell.

No interpreter binary is included in this repository. The emitter and
reader operate on source text only.

- https://github.com/rtrussell/BBCSDL
- https://github.com/Memotech-Bill/PicoBB

## 6502 BASIC — MIT

`generateBASIC` (profile `'ms'`) emits source text compatible with the
6502 BASIC interpreter, **derived from Microsoft's MIT-licensed 6502
BASIC source** (copyright (c) Microsoft Corporation). The derived work
is named basic-m6502-bw. It is never referred to as "Microsoft BASIC"
in user-facing labels.

No interpreter binary is included in this repository.

- https://github.com/microsoft/BASIC-M6502

## Not used

- Acorn BBC BASIC ROM — Crown Copyright, not redistributable, not used
- Enhanced BASIC (ehBASIC) — licence unclear, not used
