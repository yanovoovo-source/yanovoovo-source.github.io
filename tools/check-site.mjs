// Dependency-free Chrome smoke tests. Run: node tools/check-site.mjs
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const evidence = fs.mkdtempSync(path.join(os.tmpdir(), 'jianghu-check-'));
const mime = {'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.png':'image/png','.jpg':'image/jpeg'};
const server = http.createServer((req,res) => {
    const relative = decodeURIComponent(new URL(req.url,'http://localhost').pathname).replace(/^\/+/, '') || 'index.html';
    const file = path.resolve(root,relative);
    if (!file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
    fs.readFile(file,(error,data) => { res.writeHead(error ? 404 : 200,{'Content-Type':mime[path.extname(file)] || 'application/octet-stream'}); res.end(error ? 'Not found' : data); });
});
await new Promise(resolve => server.listen(0,'127.0.0.1',resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
const chrome = spawn(process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',[
    '--headless=new','--no-sandbox','--disable-gpu','--disable-extensions','--no-first-run',
    '--remote-debugging-port=0',`--user-data-dir=${path.join(evidence,'profile')}`,'about:blank'
],{windowsHide:true,stdio:['ignore','ignore','pipe']});
let ws;
try {
    const endpoint = await new Promise((resolve,reject) => {
        const timer=setTimeout(()=>reject(new Error('Chrome startup timeout')),15000);
        let log=''; chrome.stderr.on('data',chunk=>{log+=chunk;const match=log.match(/DevTools listening on (ws:\/\/[^\s]+)/);if(match){clearTimeout(timer);resolve(match[1]);}});
        chrome.once('error',error=>{clearTimeout(timer);reject(error)});
    });
    ws = new WebSocket(endpoint);
    await new Promise((resolve,reject)=>{ws.addEventListener('open',resolve,{once:true});ws.addEventListener('error',reject,{once:true})});
    let seq=0; const pending=new Map(), errors=[];
    ws.addEventListener('message',event=>{
        const msg=JSON.parse(event.data);
        if(msg.id&&pending.has(msg.id)){const {resolve,reject,timer}=pending.get(msg.id);clearTimeout(timer);pending.delete(msg.id);msg.error?reject(new Error(JSON.stringify(msg.error))):resolve(msg.result)}
        if(msg.method==='Runtime.exceptionThrown')errors.push(msg.params.exceptionDetails.text + ': ' + (msg.params.exceptionDetails.exception?.description || ''));
    });
    const send=(method,params={},sessionId)=>new Promise((resolve,reject)=>{
        const id=++seq,timer=setTimeout(()=>{pending.delete(id);reject(new Error(method+' timeout'))},10000);
        pending.set(id,{resolve,reject,timer});ws.send(JSON.stringify({id,method,params,...(sessionId?{sessionId}:{})}));
    });
    const {targetId}=await send('Target.createTarget',{url:'about:blank'});
    const {sessionId}=await send('Target.attachToTarget',{targetId,flatten:true});
    const call=(method,params)=>send(method,params,sessionId);
    const evaluate=async expression=>{const result=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(result.exceptionDetails)throw new Error(result.exceptionDetails.exception?.description || 'Evaluation failed');return result.result.value};
    const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
    await call('Page.enable');await call('Runtime.enable');
    const pages=['index.html','journal.html','library.html','gallery.html','mechanism.html'];
    const profiling=process.argv.includes('--profile');
    if(profiling)await call('Performance.enable');
    for(const width of profiling?[375,1440]:[320,375,768,1440])for(const page of profiling?['index.html']:pages){
        await call('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width<761});
        await call('Page.navigate',{url:`${origin}/${page}`});
        let ready=false;for(let i=0;i<70;i++){ready=await evaluate(`document.readyState==='complete'&&document.querySelector('#musicTrack')?.options.length===13`);if(ready)break;await pause(100)}
        if(!ready)throw new Error(`${page} did not initialize`);
        const checks=await evaluate(`(() => {
            document.querySelectorAll('.reveal').forEach(el=>el.classList.add('visible'));
            const controls=[...document.querySelector('.scene-controls').children].map(el=>el.getBoundingClientRect());
            const music=document.querySelector('.music-box');music.open=true;const panel=document.querySelector('.music-content').getBoundingClientRect();music.open=false;
            document.body.dataset.weather='snow';const pet=document.querySelector('.snowman'),face=document.querySelector('.snowman-nose');face.click();const wardrobe=document.querySelector('.pet-wardrobe').getBoundingClientRect(),petBox=pet.getBoundingClientRect();face.click();document.body.dataset.weather='clear';
            return {overflow:document.documentElement.scrollWidth>innerWidth,toolbar:controls.every((a,i)=>controls.every((b,j)=>i===j||a.right<=b.left||b.right<=a.left||a.bottom<=b.top||b.bottom<=a.top)),music:panel.left>=0&&panel.right<=innerWidth+1&&panel.top>=0&&panel.bottom<=innerHeight+1,wardrobe:wardrobe.left>=0&&wardrobe.right<=innerWidth+1,pet:innerWidth>760||petBox.bottom<=document.querySelector('.scene-controls').getBoundingClientRect().top,signature:!!document.querySelector('.signature-mark'),current:document.querySelectorAll('[aria-current="page"]').length===1,canvas:document.querySelectorAll('#moodParticles canvas').length===1&&document.querySelectorAll('#moodParticles span').length===0};
        })()`);
        if(checks.overflow||Object.entries(checks).some(([key,value])=>key!=='overflow'&&!value))throw new Error(`${width}px ${page}: ${JSON.stringify(checks)}`);
        console.log(`PASS ${width}px ${page}`);
        if(profiling)for(const weather of ['clear','rain','snow']){
            await evaluate(`document.body.dataset.weather='${weather}'`);await pause(300);
            const before=(await call('Performance.getMetrics')).metrics;
            const frames=await evaluate(`new Promise(resolve=>{const start=performance.now();let last=start,frames=0,slow=0;function step(now){if(now-last>25)slow++;last=now;frames++;window.scrollTo(0,Math.max(0,Math.sin((now-start)/600)*500+500));if(now-start<2000)requestAnimationFrame(step);else resolve({frames,slow})}requestAnimationFrame(step)})`);
            const after=(await call('Performance.getMetrics')).metrics;
            const delta=name=>Math.round(((after.find(m=>m.name===name)?.value||0)-(before.find(m=>m.name===name)?.value||0))*1000);
            console.log(JSON.stringify({width,weather,...frames,taskMs:delta('TaskDuration'),layoutMs:delta('LayoutDuration'),styleMs:delta('RecalcStyleDuration')}));
        }
        if(page==='index.html'&&(width===375||width===1440)){
            await pause(450);const shot=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});fs.writeFileSync(path.join(evidence,`home-${width}.png`),Buffer.from(shot.data,'base64'));
        }
    }
    await evaluate(`document.querySelector('#musicTrack').selectedIndex=0;document.querySelector('#musicTrack').dispatchEvent(new Event('change'));document.querySelector('#musicNext').click();if(document.querySelector('#musicTrack').selectedIndex!==1)throw new Error('Next song');document.querySelector('#musicPrevious').click();if(document.querySelector('#musicTrack').selectedIndex!==0)throw new Error('Previous song');document.body.dataset.weather='snow'`);
    const pet=await evaluate(`(() => {const r=document.querySelector('.snowman-nose').getBoundingClientRect();return {x:r.left+40,y:r.top+35}})()`);
    await call('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,x:pet.x,y:pet.y});
    await call('Input.dispatchMouseEvent',{type:'mouseMoved',button:'left',buttons:1,x:pet.x+80,y:pet.y-60});
    await pause(40);
    await evaluate(`(() => {const pet=document.querySelector('.snowman');if(Math.round(pet.getBoundingClientRect().left-parseFloat(pet.style.left))!==80)throw new Error('Drag not composited')})()`);
    await call('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,x:pet.x+80,y:pet.y-60});
    await evaluate(`(() => {const pet=document.querySelector('.snowman'),face=document.querySelector('.snowman-nose'),menu=document.querySelector('.pet-wardrobe');if(parseFloat(pet.style.left)<80)throw new Error('Pet drag');if(!menu.hidden)throw new Error('Dragging opens wardrobe');face.click();if(menu.hidden)throw new Error('Wardrobe');const hat=pet.classList.contains('has-bamboo-hat');menu.querySelector('[data-dress="hat"]').click();if(hat===pet.classList.contains('has-bamboo-hat'))throw new Error('Hat toggle');document.body.dataset.weather='clear';if(getComputedStyle(pet).display!=='none')throw new Error('Clear weather pet visibility')})()`);
    await call('Emulation.setDeviceMetricsOverride',{width:375,height:900,deviceScaleFactor:1,mobile:true});
    await call('Emulation.setTouchEmulationEnabled',{enabled:true});
    await evaluate(`document.body.dataset.weather='snow'`);await pause(50);
    const touch=await evaluate(`(() => {const r=document.querySelector('.snowman-nose').getBoundingClientRect();return {x:r.left+40,y:r.top+35,left:parseFloat(document.querySelector('.snowman').style.left)}})()`);
    await call('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:touch.x,y:touch.y}]});
    await call('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:touch.x+25,y:touch.y-45}]});
    await pause(40);await call('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    const touchLeft=await evaluate(`parseFloat(document.querySelector('.snowman').style.left)`);
    if(Math.abs(touchLeft-touch.left)<5)throw new Error('Touch drag failed');
    await evaluate(`document.querySelector('#moodSwitch').click();document.querySelector('#moodSwitch').click()`);await pause(650);
    await evaluate(`(() => {const id=document.body.dataset.scene.slice(-2);if(![...document.querySelectorAll('.scene-background-layer')].some(el=>el.style.opacity==='1'&&el.style.backgroundImage.includes('scene-'+id+'.jpg')))throw new Error('Background decode race')})()`);
    await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await pause(30);
    await evaluate(`if(getComputedStyle(document.querySelector('#moodParticles canvas')).display!=='none')throw new Error('Reduced motion')`);
    await call('Emulation.setEmulatedMedia',{features:[]});
    if(errors.length)throw new Error(errors.join('\n'));
    console.log('PASS playlist / composited mouse and touch drag / wardrobe / weather / background switching / reduced motion');
    console.log('Screenshots: '+evidence);
} finally {
    if(ws)ws.close();chrome.kill();await new Promise(resolve=>server.close(resolve));
}
