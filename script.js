const themes=[
    {id:"bamboo",name:"清晨竹影",icon:"☼",line:"风从竹梢落下，山门还没有醒透。"},
    {id:"dusk",name:"黄昏竹影",icon:"◒",line:"天色慢下来，远山收起最后一笔。"},
    {id:"night",name:"深夜竹影",icon:"☾",line:"灯影之外，只留一页未完的札记。"},
    {id:"rain",name:"雨落竹林",icon:"╱",line:"雨声替我把多余的话，一行行删去。"},
    {id:"snow",name:"初雪山门",icon:"✦",line:"雪落得很轻，像一封没有署名的信。"}
];
const fortunes=["此事宜缓行。风来之前，先把剑擦亮。","山重水复不是坏事，至少说明地图还很大。","今日运势：适合御剑，忌与代码正面交锋。","答案不在远方，在你刚才差点忽略的那一念里。","且去做。若走错了，回来添一页札记便是。","剑已出鞘。剩下的事，交给下一步。"];
const body=document.body,moodSwitch=document.querySelector("#moodSwitch"),moodIcon=document.querySelector("#moodIcon"),moodName=document.querySelector("#moodName"),sceneMood=document.querySelector("#sceneMood"),sceneLine=document.querySelector("#sceneLine"),particleField=document.querySelector("#moodParticles"),enterButton=document.querySelector("#enterButton"),jianghu=document.querySelector("#jianghu"),fortuneButton=document.querySelector("#fortuneButton"),fortuneText=document.querySelector("#fortuneText"),backToTop=document.querySelector("#backToTop"),todayLabel=document.querySelector("#todayLabel");
if(particleField){
    const fragment=document.createDocumentFragment();
    const particleCount=window.matchMedia("(max-width:760px)").matches?112:216;
    for(let i=0;i<particleCount;i++){
        const particle=document.createElement("span");
        particle.style.setProperty("--x",`${Math.round(Math.random()*100)}%`);
        particle.style.setProperty("--y",`${Math.round(-8+Math.random()*116)}%`);
        particle.style.setProperty("--size",`${(1.4+Math.random()*6.8).toFixed(1)}px`);
        particle.style.setProperty("--length",`${Math.round(28+Math.random()*86)}px`);
        particle.style.setProperty("--thickness",`${(.65+Math.random()*1.8).toFixed(2)}px`);
        particle.style.setProperty("--angle",`${Math.round(7+Math.random()*27)}deg`);
        particle.style.setProperty("--alpha",`${(.28+Math.random()*.68).toFixed(2)}`);
        particle.style.setProperty("--blur",`${(Math.random()*1.9).toFixed(2)}px`);
        particle.style.setProperty("--radius",`${Math.round(36+Math.random()*64)}%`);
        particle.style.setProperty("--delay",`${(-Math.random()*24).toFixed(2)}s`);
        particle.style.setProperty("--duration",`${(5.5+Math.random()*22).toFixed(2)}s`);
        particle.style.setProperty("--drift",`${Math.round(-90+Math.random()*180)}px`);
        particle.style.setProperty("--fall",`${Math.round(170+Math.random()*360)}px`);
        particle.dataset.depth=i%3===0?"near":i%3===1?"mid":"far";
        fragment.appendChild(particle);
    }
    particleField.appendChild(fragment);
}
let themeIndex=themes.findIndex(t=>t.id===localStorage.getItem("wulin-mood")); if(themeIndex<0)themeIndex=0;
let themeTimer;
function applyTheme(animate=false){
    const t=themes[themeIndex];
    window.clearTimeout(themeTimer);
    const syncTheme=()=>{
        body.dataset.theme=t.id;
        if(moodIcon)moodIcon.textContent=t.icon;
        if(moodName)moodName.textContent=t.name;
        if(sceneMood)sceneMood.textContent=t.name;
        if(sceneLine)sceneLine.textContent=t.line;
        if(moodSwitch)moodSwitch.setAttribute("aria-label",`切换心境与天气：当前为${t.name}`);
        localStorage.setItem("wulin-mood",t.id);
    };
    if(!animate){syncTheme();return;}
    body.classList.add("theme-changing");
    themeTimer=window.setTimeout(()=>{
        syncTheme();
        window.requestAnimationFrame(()=>body.classList.remove("theme-changing"));
    },220);
}
applyTheme();
if(moodSwitch)moodSwitch.addEventListener("click",()=>{themeIndex=(themeIndex+1)%themes.length;applyTheme(true)});
if(enterButton&&jianghu)enterButton.addEventListener("click",()=>{jianghu.scrollIntoView({behavior:"smooth",block:"start"});setTimeout(()=>jianghu.focus({preventScroll:true}),650)});
if(fortuneButton&&fortuneText)fortuneButton.addEventListener("click",()=>{const choices=fortunes.filter(f=>f!==fortuneText.textContent);fortuneText.textContent=choices[Math.floor(Math.random()*choices.length)]});
if(backToTop)backToTop.addEventListener("click",()=>window.scrollTo({top:0,behavior:"smooth"}));
if(todayLabel){const now=new Date(),formatter=new Intl.DateTimeFormat("zh-CN",{year:"numeric",month:"long",day:"numeric"});todayLabel.textContent=formatter.format(now);todayLabel.dateTime=now.toISOString().slice(0,10);}
const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add("visible");observer.unobserve(entry.target)}}),{threshold:.12});
document.querySelectorAll(".reveal").forEach(el=>observer.observe(el));
