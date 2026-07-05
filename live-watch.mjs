import { chromium } from 'playwright';
import { execSync } from 'child_process';
import C from './src/utils/sb3Creator.js';
import ex from './src/utils/examples.js';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let live=false;
for (let i=0;i<40;i++){
  try{ const html=execSync(`curl -s "https://crispstrobe.github.io/scratch-gui/editor.html?cb=${Math.random()}"`).toString();
    if (html.includes('8a928f3e')) { live=true; console.log('propagated on attempt',i+1); break; } }catch{}
  await sleep(15000);
}
if(!live){ console.log('timed out waiting for CDN propagation'); process.exit(1); }
const c=new C(); c.parse(ex.breakout);
const buf=Buffer.from(await (await c.generateSB3()).arrayBuffer());
const url='https://crispstrobe.github.io/scratch-gui/editor.html#project_url='+encodeURIComponent('data:application/octet-stream;base64,'+buf.toString('base64'));
const browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--ignore-gpu-blocklist']});
const page=await browser.newPage();
await page.goto(url,{waitUntil:'domcontentloaded',timeout:60000});
await page.waitForTimeout(14000);
const body=await page.evaluate(()=>document.body.innerText);
const found=['Paddle','Ball','Brick'].filter(n=>body.includes(n));
console.log('LIVE end-to-end sprites loaded:', found.join(', ')||'(none)');
await page.screenshot({path:'./test/browser/shots/live-final.png'});
await browser.close();
console.log(found.length>=2?'LIVE BUTTON FLOW WORKS':'live still not loading');
