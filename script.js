const themes=[{id:"bamboo",name:"清晨竹影"},{id:"dusk",name:"黄昏竹影"},{id:"night",name:"深夜竹影"},{id:"rain",name:"雨落竹林"},{id:"snow",name:"初雪山门"}];
const fortunes=["此事宜缓行。风来之前，先把剑擦亮。","山重水复不是坏事，至少说明地图还很大。","今日运势：适合御剑，忌与代码正面交锋。","答案不在远方，在你刚才差点忽略的那一念里。","且去做。若走错了，回来添一页札记便是。","剑已出鞘。剩下的事，交给下一步。"];
const body=document.body,moodSwitch=document.querySelector("#moodSwitch"),moodName=document.querySelector("#moodName"),enterButton=document.querySelector("#enterButton"),jianghu=document.querySelector("#jianghu"),fortuneButton=document.querySelector("#fortuneButton"),fortuneText=document.querySelector("#fortuneText"),backToTop=document.querySelector("#backToTop"),todayLabel=document.querySelector("#todayLabel");
let themeIndex=themes.findIndex(t=>t.id===localStorage.getItem("wulin-mood")); if(themeIndex<0)themeIndex=0;
let themeTimer;
function applyTheme(animate=false){
    const t=themes[themeIndex];
    window.clearTimeout(themeTimer);
    if(!animate){body.dataset.theme=t.id;if(moodName)moodName.textContent=t.name;localStorage.setItem("wulin-mood",t.id);return;}
    body.classList.add("theme-changing");
    themeTimer=window.setTimeout(()=>{
        body.dataset.theme=t.id;
        if(moodName)moodName.textContent=t.name;
        localStorage.setItem("wulin-mood",t.id);
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
