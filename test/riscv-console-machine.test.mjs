// Compile the current producer's output with the real pinned service toolchain
// and boot it on Brickwright's exact RV32 machine. No HTTP or remote source upload.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {execFileSync} from 'node:child_process';
import SB3Creator from '../src/utils/sb3Creator.js';
import readCowgol from '../src/utils/cowgolToPseudocode.js';

const service = process.env.COWGOL_STC_COMPILER;
const board = process.env.COWGOL_BW_BOARD;
const skip = !service || !board ? 'Set COWGOL_STC_COMPILER and COWGOL_BW_BOARD for the pinned local compiler/machine' : false;

test('Cowgol subset lowers to RV32 C, compiles and executes on the exact console machine', {skip}, async t => {
    const {RiscV32Machine} = await import(pathToFileURL(path.resolve(board, 'src/riscv32-machine.js')).href);
    const work = fs.mkdtempSync(path.join(process.cwd(), '.riscv-machine-'));
    t.after(() => fs.rmSync(work, {recursive: true, force: true}));
    const source = readCowgol(`# @bw-declaration "DEVICE RISCV32"
include "cowgol.coh";
include "brickwright.coh";
var n: int32 := 0;
while n < 6 loop n := n + 1; end loop;
bw_print_text("Cowgol to RV32");
bw_print_number(n * 7);
bw_print_number(-2147483648);
bw_print_number((-1) ^ 2147483647);
if n == 0 and (n * 2147483647) == 0 then
    bw_print_text("wrong");
else
    bw_print_text("short circuit");
end if;
`);
    assert.equal(source.ok, true, source.reasons.join('; '));
    const creator = new SB3Creator(); creator.parse(source.pseudocode);
    const generated = creator.generateRiscvC();
    assert.equal(generated.ok, true, generated.reasons.join('; '));
    const overflow = new SB3Creator();
    overflow.parse('DEVICE RISCV32\nGLOBAL n = 2147483646\nWHEN flag clicked:\n  REPEAT 2:\n    change n by 1\n  say "wrong"\n');
    fs.writeFileSync(path.join(work, 'sources.json'), JSON.stringify([generated.c, overflow.generateC()]));
    execFileSync(process.env.PYTHON || 'python3', ['-c', `
import json, pathlib, sys
sys.path.insert(0, sys.argv[1])
import app
work = pathlib.Path(sys.argv[2])
app.RISCV_GCC_STAGE = str(work / "riscv-gcc")
app.RISCV_GCC_STAGE_BIN = str(work / "riscv-gcc" / "bin")
images = []
for source in json.loads((work / "sources.json").read_text()):
    result = app.build(app.CompileReq(code=source, language="c", target="riscv32-gcc"))
    if not result.get("success"):
        raise RuntimeError(result.get("error", str(result)))
    images.append(result["image"])
(work / "images.json").write_text(json.dumps(images))
`, path.resolve(service), work], {encoding: 'utf8', timeout: 120000,
        env: {...process.env, TMPDIR: work}, maxBuffer: 1024 * 1024});
    const images = JSON.parse(fs.readFileSync(path.join(work, 'images.json'), 'utf8'));
    const machines = images.map(image => {
        const machine = new RiscV32Machine({memSize: 1 << 22, resetPc: image.entry});
        for (const segment of image.segments) machine.load(Buffer.from(segment.bytes, 'base64'), segment.addr);
        machine.run(50_000_000);
        assert.equal(machine.halted, true, 'the compiled program must halt within its instruction budget');
        return machine;
    });
    assert.equal(machines[0].exitCode, 0);
    assert.equal(machines[0].output, 'Cowgol to RV32\n42\n-2147483648\n-2147483648\nshort circuit\n');
    assert.equal(machines[1].exitCode, 1);
    assert.equal(machines[1].output, 'RISC-V console: signed int32 overflow\n');
});
