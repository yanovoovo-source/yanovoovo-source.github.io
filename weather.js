/* One canvas instead of hundreds of independently blurred, animated DOM nodes. */
(() => {
    const body = document.body, field = document.querySelector('#moodParticles');
    const reduceMotion = matchMedia('(prefers-reduced-motion:reduce)');
    const compact = matchMedia('(max-width:760px)');
    const lowPower = (navigator.hardwareConcurrency || 8) <= 4 || (navigator.deviceMemory || 8) <= 4;
    let quality = lowPower ? .8 : 1;
    const canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    const ctx = canvas.getContext('2d', {alpha:true});
    if (!field || !ctx) return;
    field.replaceChildren(canvas); field.dataset.renderer = 'canvas';
    let width=0, height=0, mode='', particles=[], frame=0, last=0, sample=0, slow=0;
    let intensity=.7, targetIntensity=.7, nextGust=0, lastPulse=0, resizeFrame=0;
    const random=(min,max)=>min+Math.random()*(max-min);
    const snowSprite=document.createElement('canvas'); snowSprite.width=snowSprite.height=24;
    const snowContext=snowSprite.getContext('2d');
    const snowFill=snowContext.createRadialGradient(10,9,1,12,12,11);
    snowFill.addColorStop(0,'rgba(255,253,248,1)'); snowFill.addColorStop(.35,'rgba(246,247,247,.95)'); snowFill.addColorStop(1,'rgba(237,239,245,0)');
    snowContext.fillStyle=snowFill; snowContext.fillRect(0,0,24,24);
    const sparks=['#e8bc77','#dfb5b8'].map(color=>{
        const sprite=document.createElement('canvas');sprite.width=sprite.height=16;
        const c=sprite.getContext('2d');c.fillStyle=color;c.beginPath();c.ellipse(8,8,4,2.2,-.6,0,Math.PI*2);c.fill();return sprite;
    });
    function seed(initial=true) {
        return {x:random(-20,width+20),y:initial?random(-40,height):random(-60,-10),z:Math.floor(random(0,3)),r:random(.8,3.8),speed:random(0,1),phase:random(0,Math.PI*2),alpha:random(.3,.85),length:random(10,34)};
    }
    function budget() {
        const count=mode==='rain'?(compact.matches?240:440):mode==='snow'?(compact.matches?165:300):(compact.matches?20:38);
        return Math.round(count*quality);
    }
    function rebuild() { particles=Array.from({length:budget()},()=>seed());field.dataset.particles=String(particles.length); }
    function resize() {
        width=innerWidth;height=innerHeight;
        const ratio=Math.min(devicePixelRatio || 1,lowPower?1:compact.matches?1.25:1.5);
        canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);
        ctx.setTransform(ratio,0,0,ratio,0,0);rebuild();
    }
    function stop() { cancelAnimationFrame(frame);frame=0;last=0; }
    function start() { if (!frame&&!document.hidden&&!reduceMotion.matches) frame=requestAnimationFrame(draw); }
    function updateWeather() {
        const next=body.dataset.weather || 'clear';
        if (next!==mode) {mode=next;intensity=targetIntensity=.7;nextGust=0;rebuild();ctx.clearRect(0,0,width,height);}
        if (reduceMotion.matches) {stop();ctx.clearRect(0,0,width,height);} else start();
    }
    function draw(now) {
        frame=0;if(document.hidden||reduceMotion.matches){last=0;return;}
        const elapsed=last?now-last:16.7,dt=Math.min(elapsed/1000,.05);last=now;
        if(now>nextGust){targetIntensity=random(.35,1);nextGust=now+random(5500,14500);}
        intensity+=(targetIntensity-intensity)*Math.min(1,dt*.35);
        ctx.clearRect(0,0,width,height);
        const visible=Math.round(particles.length*(.5+intensity*.5)),wind=Math.sin(now*.00017)*9;
        if(mode==='rain'){
            for(let depth=0;depth<3;depth++){
                ctx.globalAlpha=(.2+depth*.2)*(.6+intensity*.4);ctx.strokeStyle='#dee2e6';ctx.lineWidth=.55+depth*.4;ctx.beginPath();
                for(let i=0;i<visible;i++){
                    const p=particles[i];if(p.z!==depth)continue;
                    p.y+=(650+p.speed*850+depth*160)*dt;p.x+=(7+wind)*dt;
                    if(p.y>height+40){p.x=random(-20,width+20);p.y=random(-60,-10);}
                    ctx.moveTo(p.x,p.y);ctx.lineTo(p.x+1.3+wind*.08,p.y+p.length*(.6+depth*.25));
                }
                ctx.stroke();
            }
        }else{
            for(let i=0;i<visible;i++){
                const p=particles[i];
                p.y+=(mode==='snow'?24+p.speed*67:6+p.speed*13)*dt;
                p.x+=(wind+Math.sin(now*.0008+p.phase)*(mode==='snow'?12:5))*dt;
                if(p.y>height+14){Object.assign(p,seed(false));}else if(p.x<-24)p.x=width+12;else if(p.x>width+24)p.x=-12;
                ctx.globalAlpha=p.alpha*(.65+intensity*.35);
                const size=mode==='snow'?p.r*(p.z===2?3:2):p.r*2;
                ctx.drawImage(mode==='snow'?snowSprite:sparks[p.z%2],p.x-size/2,p.y-size/2,size,size);
            }
        }
        ctx.globalAlpha=1;
        if(now-lastPulse>1000){lastPulse=now;dispatchEvent(new CustomEvent('jianghu-weather-pulse',{detail:{weather:mode,intensity}}));}
        if(++sample>=90){
            if(slow>25&&quality>.55){quality=Math.max(.55,quality-.15);particles.length=Math.min(particles.length,budget());field.dataset.particles=String(particles.length);}
            sample=slow=0;
        }else if(elapsed>34)slow++;
        frame=requestAnimationFrame(draw);
    }

    // Decode before swapping; only two opacity-composited background layers are needed.
    const background=document.createElement('div');background.className='scene-background';background.setAttribute('aria-hidden','true');
    const layers=[0,1].map(()=>{const layer=document.createElement('div');layer.className='scene-background-layer';background.append(layer);return layer});
    body.prepend(background);
    let scene='',active=0,sceneRequest=0,initialized=false;
    const images=new Map(), urls=['01','02','03'].map(id=>`assets/jianghu-scene-${id}.jpg`);
    function decode(url){
        if(!images.has(url)){const image=new Image();image.decoding='async';image.src=url;images.set(url,image.decode().then(()=>true).catch(()=>false));}
        return images.get(url);
    }
    async function updateScene(){
        const next=body.dataset.scene || 'scene-01';if(next===scene)return;scene=next;
        const index=Math.max(0,['scene-01','scene-02','scene-03'].indexOf(next)),id=++sceneRequest;
        if(!await decode(urls[index])||id!==sceneRequest)return;
        const target=initialized?1-active:active;
        layers[target].style.backgroundImage=`linear-gradient(180deg,rgba(8,7,10,.22),rgba(10,8,12,.58)),url("${urls[index]}")`;
        if(!initialized)layers[target].style.transition='none';
        layers[target].style.opacity='1';layers[1-target].style.opacity='0';active=target;initialized=true;
        body.classList.add('has-scene-background');
        requestAnimationFrame(()=>layers[target].style.removeProperty('transition'));
        const preload=()=>{if(!document.hidden)decode(urls[(index+1)%urls.length]);};
        if('requestIdleCallback' in window)requestIdleCallback(preload,{timeout:2500});else setTimeout(preload,900);
    }
    new MutationObserver(records=>{
        if(records.some(r=>r.attributeName==='data-weather'))updateWeather();
        if(records.some(r=>r.attributeName==='data-scene'))updateScene();
    }).observe(body,{attributes:true,attributeFilter:['data-weather','data-scene']});
    addEventListener('resize',()=>{cancelAnimationFrame(resizeFrame);resizeFrame=requestAnimationFrame(resize);},{passive:true});
    document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();else start();});
    addEventListener('pagehide',stop);addEventListener('pageshow',start);
    reduceMotion.addEventListener('change',updateWeather);
    resize();updateWeather();updateScene();
})();
