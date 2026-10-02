const scenes=[
    {id:"scene-01",name:"花灯水巷",icon:"✦",line:"楼影沉在水里，花枝从檐角探出来。"},
    {id:"scene-02",name:"朱门长街",icon:"❖",line:"长街灯火未歇，江湖还在檐下往来。"},
    {id:"scene-03",name:"塔影旧城",icon:"✧",line:"塔影压着旧城，风把远处的花吹来。"}
];
const weathers=[
    {id:"clear",name:"花落无声",icon:"❀",line:"花瓣和金屑偶尔掠过屏面。"},
    {id:"rain",name:"檐下听雨",icon:"╱",line:"雨线忽密忽疏，顺着屋檐落下。"},
    {id:"snow",name:"灯下初雪",icon:"❄",line:"雪片有远有近，慢慢落在檐与纸面。"}
];
const fortunes=["此事宜缓行。风来之前，先把剑擦亮。","山重水复不是坏事，至少说明地图还很大。","今日运势：适合御剑，忌与代码正面交锋。","答案不在远方，在你刚才差点忽略的那一念里。","且去做。若走错了，回来添一页札记便是。","剑已出鞘。剩下的事，交给下一步。"];
const body=document.body,moodSwitch=document.querySelector("#moodSwitch"),moodIcon=document.querySelector("#moodIcon"),moodName=document.querySelector("#moodName"),weatherSwitch=document.querySelector("#weatherSwitch"),weatherIcon=document.querySelector("#weatherIcon"),weatherName=document.querySelector("#weatherName"),sceneMood=document.querySelector("#sceneMood"),sceneIndexLabel=document.querySelector("#sceneIndexLabel"),sceneLine=document.querySelector("#sceneLine"),particleField=document.querySelector("#moodParticles"),enterButton=document.querySelector("#enterButton"),jianghu=document.querySelector("#jianghu"),fortuneButton=document.querySelector("#fortuneButton"),fortuneText=document.querySelector("#fortuneText"),backToTop=document.querySelector("#backToTop"),todayLabel=document.querySelector("#todayLabel");
if(particleField){
    const fragment=document.createDocumentFragment();
    const particleCount=window.matchMedia("(max-width:760px)").matches?108:188;
    for(let i=0;i<particleCount;i++){
        const particle=document.createElement("span");
        particle.style.setProperty("--x",`${Math.round(Math.random()*100)}%`);
        particle.style.setProperty("--y",`${Math.round(-8+Math.random()*116)}%`);
        particle.style.setProperty("--size",`${(1.5+Math.random()*4.7).toFixed(1)}px`);
        particle.style.setProperty("--length",`${Math.round(18+Math.random()*43)}px`);
        particle.style.setProperty("--thickness",`${(.55+Math.random()*1.3).toFixed(2)}px`);
        particle.style.setProperty("--angle",`${Math.round(4+Math.random()*10)}deg`);
        particle.style.setProperty("--alpha",`${(.32+Math.random()*.58).toFixed(2)}`);
        particle.style.setProperty("--blur",`${(Math.random()*1.15).toFixed(2)}px`);
        particle.style.setProperty("--radius",`${Math.round(36+Math.random()*64)}%`);
        particle.style.setProperty("--delay",`${(-Math.random()*18).toFixed(2)}s`);
        particle.style.setProperty("--duration",`${(5.5+Math.random()*22).toFixed(2)}s`);
        particle.style.setProperty("--drift",`${Math.round(-90+Math.random()*180)}px`);
        particle.style.setProperty("--rain-duration",`${(.72+Math.random()*.72).toFixed(2)}s`);
        particle.style.setProperty("--snow-duration",`${(6.2+Math.random()*7.4).toFixed(2)}s`);
        particle.style.setProperty("--rain-drift",`${Math.round(15+Math.random()*50)}px`);
        particle.style.setProperty("--snow-drift",`${Math.round(-55+Math.random()*110)}px`);
        particle.dataset.depth=Math.random()<.18?"near":Math.random()<.62?"mid":"far";
        fragment.appendChild(particle);
    }
    particleField.appendChild(fragment);
}
let sceneIndex=scenes.findIndex(s=>s.id===localStorage.getItem("wulin-scene")); if(sceneIndex<0)sceneIndex=0;
let weatherIndex=weathers.findIndex(w=>w.id===localStorage.getItem("wulin-weather")); if(weatherIndex<0)weatherIndex=0;
let themeTimer;
function applyScene(animate=false){
    const scene=scenes[sceneIndex],weather=weathers[weatherIndex];
    window.clearTimeout(themeTimer);
    const sync=()=>{
        body.dataset.theme=scene.id;
        body.dataset.scene=scene.id;
        body.dataset.weather=weather.id;
        if(moodIcon)moodIcon.textContent=scene.icon;
        if(moodName)moodName.textContent=scene.name;
        if(weatherIcon)weatherIcon.textContent=weather.icon;
        if(weatherName)weatherName.textContent=weather.name;
        if(sceneMood)sceneMood.textContent=scene.name;
        if(sceneIndexLabel)sceneIndexLabel.textContent=`SCENE / ${String(sceneIndex+1).padStart(2,"0")}`;
        if(sceneLine)sceneLine.textContent=`${scene.line} ${weather.line}`;
        if(moodSwitch)moodSwitch.setAttribute("aria-label",`切换背景：当前为${scene.name}`);
        if(weatherSwitch)weatherSwitch.setAttribute("aria-label",`切换天气：当前为${weather.name}`);
        localStorage.setItem("wulin-scene",scene.id);
        localStorage.setItem("wulin-weather",weather.id);
    };
    if(!animate){sync();return;}
    body.classList.add("theme-changing");
    themeTimer=window.setTimeout(()=>{
        sync();
        window.requestAnimationFrame(()=>body.classList.remove("theme-changing"));
    },260);
}
applyScene();
if(moodSwitch)moodSwitch.addEventListener("click",()=>{sceneIndex=(sceneIndex+1)%scenes.length;applyScene(true)});
if(weatherSwitch)weatherSwitch.addEventListener("click",()=>{weatherIndex=(weatherIndex+1)%weathers.length;applyScene(true)});
if(enterButton&&jianghu)enterButton.addEventListener("click",()=>{jianghu.scrollIntoView({behavior:"smooth",block:"start"});setTimeout(()=>jianghu.focus({preventScroll:true}),650)});
if(fortuneButton&&fortuneText)fortuneButton.addEventListener("click",()=>{const choices=fortunes.filter(f=>f!==fortuneText.textContent);fortuneText.textContent=choices[Math.floor(Math.random()*choices.length)]});
if(backToTop)backToTop.addEventListener("click",()=>window.scrollTo({top:0,behavior:"smooth"}));
if(todayLabel){const now=new Date(),formatter=new Intl.DateTimeFormat("zh-CN",{year:"numeric",month:"long",day:"numeric"});todayLabel.textContent=formatter.format(now);todayLabel.dateTime=now.toISOString().slice(0,10);}
const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add("visible");observer.unobserve(entry.target)}}),{threshold:.12});
document.querySelectorAll(".reveal").forEach(el=>observer.observe(el));
