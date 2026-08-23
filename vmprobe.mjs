import nodeVm from 'node:vm';
import { readFileSync } from 'node:fs';
import VM from 'scratch-vm';
import SB3Creator from '/tmp/wt-stc12-conf/src/utils/sb3Creator.js';

console.warn = () => {};
const BlockType = { COMMAND:'command', REPORTER:'reporter', BOOLEAN:'Boolean', HAT:'hat', EVENT:'event', CONDITIONAL:'conditional', LOOP:'loop', BUTTON:'button', LABEL:'label', XML:'xml' };
const ArgumentType = { NUMBER:'number', STRING:'string', BOOLEAN:'Boolean', ANGLE:'angle', COLOR:'color', MATRIX:'matrix', NOTE:'note', IMAGE:'image', COSTUME:'costume', SOUND:'sound' };
const Cast = { toNumber:v=>{const n=Number(v);return Number.isNaN(n)?0:n;}, toString:String, toBoolean:v=>typeof v==='boolean'?v:(v==='true'||(typeof v==='number'&&v!==0)||(typeof v==='string'&&v!==''&&v!=='0'&&v.toLowerCase()!=='false')), compare:(a,b)=>{const na=Number(a),nb=Number(b);if(!Number.isNaN(na)&&!Number.isNaN(nb))return na-nb;const sa=String(a).toLowerCase(),sb=String(b).toLowerCase();return sa<sb?-1:sa>sb?1:0;}, toListIndex:(i,l)=>{const n=Math.floor(Number(i));return (n<1||n>l)?0:n;} };
const permissive = () => new Proxy(function(){}, { get:(t,k)=>k==='then'?undefined:permissive(), apply:()=>permissive(), construct:()=>permissive() });

function loadExtSource (source, runtime) {
  let captured = null;
  const Scratch = { BlockType, ArgumentType, Cast, TargetType:{SPRITE:'sprite',STAGE:'stage'},
    translate: Object.assign(m=>(m&&typeof m==='object'?(m.default||''):m), {setup:()=>{}}),
    extensions:{ register:i=>{captured=i;}, unsandboxed:true, isPenguinMod:false }, vm:{ runtime } };
  const known = { Scratch, console:new Proxy({},{get:()=>()=>{}}), setTimeout:()=>0, clearTimeout:()=>{}, setInterval:()=>0, clearInterval:()=>{}, module:{exports:null}, exports:{} };
  const sandbox = new Proxy(known, { has:()=>true, get:(t,k)=>(k in t?t[k]:(t[k]=permissive())) });
  nodeVm.createContext(sandbox);
  nodeVm.runInContext(source, sandbox, { timeout:5000 });
  return captured;
}

const BUNDLED = readFileSync('/mnt/volume1/code/lego/brickwright-lite/overlay/scratch-vm/src/extensions/crispstrobe/stc12/index.js','utf8')
  .match(/makeExt\(`([\s\S]*)`\);?\s*$/)[1];
const REFERENCE = readFileSync('/tmp/wt-stc12-conf/reference/extensions/stc12.js','utf8');

async function runWith (extSource, label) {
  const code = readFileSync('/tmp/wt-stc12-conf/examples/79-a2-sampler/program.bw','utf8');
  const c = new SB3Creator(); c.parse(code);
  const buf = Buffer.from(await (await c.generateSB3()).arrayBuffer());
  const vm = new VM();
  const em = vm.extensionManager;
  em.loadExtensionURL = (url) => {
    const inst = loadExtSource(extSource, vm.runtime);
    em._loadedExtensions.set(url, em._registerInternalExtension(inst));
    return Promise.resolve();
  };
  let loadError = null;
  try { await vm.loadProject(buf); } catch (e) { loadError = e; }
  console.log(`\n===== ${label} =====`);
  console.log('  loadProject threw:', loadError ? loadError.message : 'NO — project loaded clean');
  if (loadError) return;

  // Inventory: which stc12 opcodes in the project have a runtime implementation?
  const used = new Set();
  for (const t of vm.runtime.targets) for (const b of Object.values(t.blocks._blocks||{}))
    if (b.opcode?.startsWith('stc12_')) used.add(b.opcode);
  const dead = [...used].filter(o => typeof vm.runtime.getOpcodeFunction(o) === 'undefined');
  console.log('  stc12 opcodes in project:', used.size);
  console.log('  WITHOUT a runtime function (silent no-op):', dead.length ? dead.join(', ') : '(none)');

  // Hat recognition: does `WHEN key N pressed` register as a hat at all?
  console.log('  runtime.getIsHat("stc12_whenkey"):', vm.runtime.getIsHat('stc12_whenkey'));

  vm.start(); vm.greenFlag();
  for (let i=0;i<60;i++) vm.runtime._step();
  const vars = {};
  for (const t of vm.runtime.targets) for (const v of Object.values(t.variables)) vars[v.name]=v.value;
  console.log('  after 60 frames, variables:', JSON.stringify(vars));
  vm.quit();
}
await runWith(BUNDLED, 'BUNDLED (what lite ships, 20 blocks)');
await runWith(REFERENCE, 'REFERENCE (sb3-creator in-repo, 30 blocks)');
process.exit(0);
