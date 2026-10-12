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
            return {overflow:document.documentElement.scrollWidth>innerWidth,toolbar:controls.every((a,i)=>controls.every((b,j)=>i===j||a.right<=b.left||b.right<=a.left||a.bottom<=b.top||b.bottom<=a.top)),music:panel.left>=0&&panel.right<=innerWidth+1&&panel.top>=0&&panel.bottom<=innerHeight+1,wardrobe:wardrobe.left>=0&&wardrobe.right<=innerWidth+1&&wardrobe.top>=0&&wardrobe.bottom<=innerHeight+1,pet:innerWidth>760||petBox.bottom<=document.querySelector('.scene-controls').getBoundingClientRect().top,signature:!!document.querySelector('.signature-mark'),current:document.querySelectorAll('[aria-current="page"]').length===1,canvas:document.querySelectorAll('#moodParticles canvas').length===1&&document.querySelectorAll('#moodParticles span').length===0};
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
    await evaluate(`document.body.dataset.weather='snow'`);await pause(200);
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

    // Player state tests use a controlled media source: no external song requests.
    const {identifier}=await call('Page.addScriptToEvaluateOnNewDocument',{source:`
        window.Audio=class extends EventTarget {
            constructor(){super();this.paused=true;this.duration=240;this._time=0;this.seeks=0;window.__testAudio=this;}
            get currentTime(){return this._time;}
            set currentTime(value){this._time=value;this.seeks++;}
            play(){this.paused=false;return new Promise((resolve,reject)=>{this._resolve=resolve;this._reject=reject;});}
            pause(){this.paused=true;if(this._reject)this._reject(new DOMException('Cancelled','AbortError'));this._resolve=this._reject=null;this.dispatchEvent(new Event('pause'));}
            finish(){const resolve=this._resolve;this._resolve=this._reject=null;this.dispatchEvent(new Event('play'));if(resolve)resolve();}
        };`});
    await call('Page.navigate',{url:`${origin}/index.html`});
    let playerReady=false;for(let i=0;i<70;i++){playerReady=await evaluate(`document.readyState==='complete'&&!!window.__testAudio&&document.querySelector('#musicTrack')?.options.length===13`);if(playerReady)break;await pause(100)}
    if(!playerReady)throw new Error('Controlled player did not initialize');
    await evaluate(`(async()=>{
        const audio=window.__testAudio,play=document.querySelector('#musicPlay'),music=document.querySelector('.music-box'),seek=document.querySelector('#musicSeek');
        if(!audio.paused)throw new Error('Unexpected autoplay');
        music.open=true;await new Promise(resolve=>setTimeout(resolve,20));
        play.click();if(play.getAttribute('aria-busy')!=='true')throw new Error('Loading feedback');
        play.click();await Promise.resolve();if(!audio.paused||play.getAttribute('aria-busy')!=='false')throw new Error('Cancel pending playback');
        play.click();document.querySelector('#musicNext').click();
        if(audio.paused||play.getAttribute('aria-busy')!=='true')throw new Error('Switch track while loading');
        audio.finish();await Promise.resolve();if(play.getAttribute('aria-busy')!=='false'||play.getAttribute('aria-pressed')!=='true')throw new Error('Playback state');
        audio._time=24;audio.dispatchEvent(new Event('loadedmetadata'));
        if(seek.disabled||seek.value!=='100')throw new Error('Initial seek position');
        for(const value of ['300','400','500']){seek.value=value;seek.dispatchEvent(new Event('input'));}
        audio.dispatchEvent(new Event('timeupdate'));
        if(audio.seeks!==0||seek.value!=='500'||!document.querySelector('#musicTime').textContent.startsWith('2:00'))throw new Error('Scrubbing preview interrupted');
        seek.dispatchEvent(new Event('change'));
        if(audio.seeks!==1||audio.currentTime!==120)throw new Error('Seek must commit once');
        music.open=false;audio._time=180;audio.dispatchEvent(new Event('timeupdate'));
        if(seek.value!=='500')throw new Error('Closed player keeps rendering');
        music.open=true;await new Promise(resolve=>setTimeout(resolve,20));
        if(seek.value!=='750')throw new Error('Reopened player out of sync');
        const volume=document.querySelector('#musicVolume');volume.value='47';volume.dispatchEvent(new Event('input'));
        if(audio.volume!==.47)throw new Error('Volume preview');
        volume.dispatchEvent(new Event('change'));if(localStorage.getItem('jianghu-music-volume')!=='47')throw new Error('Volume persistence');
        play.click();if(!audio.paused)throw new Error('Pause playback');
    })()`);
    await call('Page.removeScriptToEvaluateOnNewDocument',{identifier});
    await evaluate(`window.__canvasWrites=0;window.__canvasObserver=new MutationObserver(records=>window.__canvasWrites+=records.length);window.__canvasObserver.observe(document.querySelector('#moodParticles canvas'),{attributes:true,attributeFilter:['width','height']});for(let i=0;i<20;i++)dispatchEvent(new Event('resize'))`);
    await pause(200);
    if(await evaluate('window.__canvasWrites')!==0)throw new Error('Unchanged viewport reallocates canvas');
    for(const height of [800,700,600])await call('Emulation.setDeviceMetricsOverride',{width:375,height,deviceScaleFactor:1,mobile:true});
    await pause(220);
    await evaluate(`(() => {const c=document.querySelector('#moodParticles canvas');if(window.__canvasWrites!==2||Math.abs(c.height/c.width-innerHeight/innerWidth)>.005)throw new Error('Resize not coalesced');if(document.documentElement.scrollWidth>innerWidth)throw new Error('Resize overflow');window.__canvasObserver.disconnect()})()`);
    await call('Emulation.setDeviceMetricsOverride',{width:800,height:450,deviceScaleFactor:1,mobile:true});await pause(220);
    await evaluate(`document.body.dataset.weather='snow';const box=document.querySelector('.snowman').getBoundingClientRect();if(box.right>innerWidth||box.bottom>innerHeight)throw new Error('Landscape pet bounds')`);
    await call('Emulation.setDeviceMetricsOverride',{width:375,height:900,deviceScaleFactor:1,mobile:true});await pause(220);

    // Winter companion: the enlarged wardrobe must fit beside every screen corner.
    for(const [width,height] of [[320,740],[375,900],[800,450]]){
        await call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:true});await pause(220);
        await evaluate(`(() => {
            document.body.dataset.weather='snow';
            const pet=document.querySelector('.snowman'),face=document.querySelector('.snowman-nose'),menu=document.querySelector('.pet-wardrobe-panel');
            if(!menu||document.querySelectorAll('.pet-sculpture svg').length!==1)throw new Error('Snow sculpture or wardrobe missing');
            for(const corner of ['bottom-left','bottom-right','top-left','top-right']){
                if(!menu.hidden)face.click();
                face.dispatchEvent(new KeyboardEvent('keydown',{key:'Home',bubbles:true}));
                if(corner.endsWith('right'))for(let i=0;i<Math.ceil(innerWidth/25)+2;i++)face.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',shiftKey:true,bubbles:true}));
                if(corner.startsWith('top'))for(let i=0;i<Math.ceil(innerHeight/25)+2;i++)face.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowUp',shiftKey:true,bubbles:true}));
                face.click();
                const r=menu.getBoundingClientRect();
                if(menu.hidden||face.getAttribute('aria-expanded')!=='true'||r.width===0||r.left<0||r.top<0||r.right>innerWidth+1||r.bottom>innerHeight+1)throw new Error('Wardrobe bounds '+innerWidth+'x'+innerHeight+' '+corner+' '+JSON.stringify({left:r.left,top:r.top,right:r.right,bottom:r.bottom}));
                face.click();
            }
        })()`);
        console.log('PASS snow wardrobe four corners '+width+'x'+height);
    }
    await call('Emulation.setDeviceMetricsOverride',{width:375,height:900,deviceScaleFactor:1,mobile:true});await pause(220);
    const rememberedOutfit=await evaluate(`(() => {
        const pet=document.querySelector('.snowman'),face=document.querySelector('.snowman-nose'),menu=document.querySelector('.pet-wardrobe-panel');
        face.dispatchEvent(new KeyboardEvent('keydown',{key:'Home',bubbles:true}));if(menu.hidden)face.click();
        const ids=['vermilion','moon','swordsman','traveler','winter','bare'],buttons=[...menu.querySelectorAll('[data-outfit]')];
        if(buttons.length!==ids.length||ids.some(id=>!buttons.some(button=>button.dataset.outfit===id)))throw new Error('Six outfit choices');
        for(const id of ids){
            const selected=menu.querySelector('[data-outfit="'+id+'"]');selected.click();
            const pressed=buttons.filter(button=>button.getAttribute('aria-pressed')==='true');
            if(pet.dataset.outfit!==id||localStorage.getItem('jianghu-pet-outfit')!==id||pressed.length!==1||pressed[0]!==selected)throw new Error('Outfit selection '+id);
            for(const [key,className] of [['nose','has-nose'],['hat','has-bamboo-hat'],['scarf','has-scarf']]){
                const toggle=menu.querySelector('[data-dress="'+key+'"]'),before=pet.classList.contains(className);
                toggle.click();if(pet.classList.contains(className)===before||toggle.getAttribute('aria-pressed')!==String(!before))throw new Error('Outfit accessory '+id+' '+key);
                toggle.click();if(pet.classList.contains(className)!==before)throw new Error('Accessory restore '+id+' '+key);
            }
            const r=menu.getBoundingClientRect();if(r.left<0||r.top<0||r.right>innerWidth+1||r.bottom>innerHeight+1)throw new Error('Outfit changes wardrobe bounds '+id);
        }
        menu.querySelector('[data-outfit="winter"]').click();
        return {outfit:pet.dataset.outfit,nose:pet.classList.contains('has-nose'),hat:pet.classList.contains('has-bamboo-hat'),scarf:pet.classList.contains('has-scarf')};
    })()`);
    await call('Page.reload',{ignoreCache:true});
    let petReady=false;for(let i=0;i<70;i++){petReady=await evaluate(`document.readyState==='complete'&&document.querySelectorAll('.pet-wardrobe button[data-outfit]').length===6`);if(petReady)break;await pause(100)}
    if(!petReady)throw new Error('Winter companion did not reinitialize');
    const restoredOutfit=await evaluate(`(() => {const pet=document.querySelector('.snowman');return {outfit:pet.dataset.outfit,nose:pet.classList.contains('has-nose'),hat:pet.classList.contains('has-bamboo-hat'),scarf:pet.classList.contains('has-scarf')}})()`);
    if(JSON.stringify(restoredOutfit)!==JSON.stringify(rememberedOutfit))throw new Error('Outfit refresh persistence '+JSON.stringify({rememberedOutfit,restoredOutfit}));

    // Separate evidence for the full mobile page, sculpted pet and open wardrobe.
    await evaluate(`(() => {
        scrollTo(0,0);document.body.dataset.weather='snow';document.querySelectorAll('.reveal').forEach(el=>el.classList.add('visible'));
        const pet=document.querySelector('.snowman'),face=document.querySelector('.snowman-nose'),menu=document.querySelector('.pet-wardrobe-panel');
        face.dispatchEvent(new KeyboardEvent('keydown',{key:'Home',bubbles:true}));if(menu.hidden)face.click();
        menu.querySelector('[data-outfit="vermilion"]').click();
        for(const [key,className,wanted] of [['nose','has-nose',true],['hat','has-bamboo-hat',false],['scarf','has-scarf',true]])if(pet.classList.contains(className)!==wanted)menu.querySelector('[data-dress="'+key+'"]').click();
        if(!menu.hidden)face.click();
    })()`);await pause(450);
    const mobileSnow=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
    fs.writeFileSync(path.join(evidence,'snow-mobile-375.png'),Buffer.from(mobileSnow.data,'base64'));
    const petClip=await evaluate(`(() => {const r=document.querySelector('.snowman').getBoundingClientRect(),x=Math.max(0,r.left-16),y=Math.max(0,r.top-18);return {x,y,width:Math.min(innerWidth-x,r.width+32),height:Math.min(innerHeight-y,r.height+36),scale:3}})()`);
    const petCloseup=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:false,clip:petClip});
    fs.writeFileSync(path.join(evidence,'snow-pet-closeup.png'),Buffer.from(petCloseup.data,'base64'));
    await evaluate(`document.querySelector('.snowman-nose').click()`);await pause(100);
    const openWardrobe=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
    fs.writeFileSync(path.join(evidence,'snow-wardrobe-375.png'),Buffer.from(openWardrobe.data,'base64'));
    await evaluate(`(() => {const pet=document.querySelector('.snowman').getBoundingClientRect(),menu=document.querySelector('.pet-wardrobe').getBoundingClientRect();if(menu.left<pet.right&&menu.right>pet.left&&menu.top<pet.bottom&&menu.bottom>pet.top)throw new Error('Default mobile wardrobe hides snow guest')})()`);
    for(const id of ['vermilion','moon','swordsman','traveler','winter','bare']){
        await evaluate(`document.querySelector('.pet-wardrobe [data-outfit="${id}"]').click();document.querySelector('.pet-wardrobe').hidden=true`);
        await pause(35);
        const outfitShot=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:false,clip:petClip});
        fs.writeFileSync(path.join(evidence,`snow-outfit-${id}.png`),Buffer.from(outfitShot.data,'base64'));
    }
    if(errors.length)throw new Error(errors.join('\n'));
    console.log('PASS playlist / composited mouse and touch drag / wardrobe / weather / background switching / reduced motion');
    console.log('PASS loading cancellation / single-commit scrubbing / closed-player idle / volume / coalesced viewport resize / landscape pet');
    console.log('PASS six winter outfits / accessories in every outfit / reload persistence / phone and landscape wardrobe bounds');
    console.log('Screenshots: '+evidence);
} finally {
    if(ws)ws.close();chrome.kill();await new Promise(resolve=>server.close(resolve));
}
