/* The calendar is local, loaded only on this page. Recompute at minute boundaries
   while visible; only redraw the reading when its actual inputs have changed. */
(() => {
    'use strict';
    const form=document.querySelector('#qimenForm');
    if(!form||!window.JianghuQimen)return;
    const api=window.JianghuQimen,$=id=>document.getElementById(id);
    const status=$('qimenStatus'),live=$('qimenLive'),time=$('qimenTime'),submit=$('qimenSubmit');
    let calendarPromise=null,current=null,selected=null,lastSignature='',timer=null,generation=0;
    const nowBeijing=()=>new Date(Date.now()+8*60*60*1000).toISOString().slice(0,16);
    const write=(id,value)=>{$(id).textContent=value;};
    const node=(tag,text,className)=>{const el=document.createElement(tag);if(text!==undefined)el.textContent=text;if(className)el.className=className;return el;};
    const announce=(text,error=false)=>{status.textContent=text;status.classList.toggle('is-error',error);};
    function loadCalendar() {
        if(window.Solar)return Promise.resolve(window);
        if(calendarPromise)return calendarPromise;
        calendarPromise=new Promise((resolve,reject)=>{
            const script=document.createElement('script');script.src='assets/vendor/lunar.js?v=4c45a59';script.async=true;
            const fail=()=>{script.remove();calendarPromise=null;reject(new Error('历法文件未能载入，请稍后再起一局。'));};
            script.onload=()=>window.Solar?resolve(window):fail();script.onerror=fail;
            document.head.append(script);
        });
        return calendarPromise;
    }
    function values() {
        return {name:$('qimenName').value,gender:$('qimenGender').value,birthDate:$('qimenBirth').value,birthTime:$('qimenBirthTime').value};
    }
    function renderPalace(n) {
        if(!current)return;
        selected=n;
        const reading=api.readPalace(current.chart,n),panel=$('qimenPalaceReading');
        panel.replaceChildren(node('h4',reading.title),node('p',reading.theme));
        for(const line of reading.lines){const item=node('div',undefined,'qimen-evidence');item.append(node('strong',line.label),node('p',line.evidence),node('small',line.note));panel.append(item);}
        $('qimenBoard').querySelectorAll('button').forEach(button=>button.setAttribute('aria-pressed',String(Number(button.dataset.palace)===n)));
    }
    function render(chart,profile,topic,question) {
        const reading=api.analyze(chart,topic,profile),personal=!!profile.palace;
        current={chart,profile,reading,question};
        write('qimenJu',`${chart.yang?'阳':'阴'}遁${'〇一二三四五六七八九'[chart.ju]}局 · ${chart.yuan}`);
        write('qimenProfileLine',`${profile.name?profile.name+' · ':''}${profile.gender!=='未填写'?profile.gender+' · ':''}${personal?`${profile.age} 周岁 · ${profile.pillar}年命，落${api.PALACES[profile.palace].name}宫`:'共同时盘 · 填出生日期后看个人年命'}`);
        const pillars=$('qimenPillars');pillars.replaceChildren();
        for(const [key,label] of [['year','年柱'],['month','月柱'],['day','日柱'],['hour','时柱']]){const item=node('div');item.append(node('small',label),node('strong',chart.pillars[key]));pillars.append(item);}
        write('qimenMeta',`${chart.termName} · 旬首${chart.xun}（遁${chart.hiddenStem}） · 值符${chart.chiefStar} / 值使${chart.chiefDoor} · 时空${chart.voids.join('')} · 驿马${chart.horse}`);
        const board=$('qimenBoard');board.replaceChildren();
        for(const n of api.ORDER){
            const p=api.PALACES[n],cell=node('button',undefined,'qimen-cell'+(n===5?' qimen-center':''));
            cell.type='button';cell.dataset.palace=n;cell.setAttribute('aria-pressed','false');
            cell.setAttribute('aria-label',`${p.name}宫，${p.direction}${n===5?'，中宫寄坤':`，${chart.doors[n]}，${chart.stars[n]}，${chart.gods[n]}`}，查看依据`);
            if(n===5){cell.append(node('span','中五','qimen-cell-head'),node('span','天禽寄坤','qimen-cell-star'),node('span',`地盘 ${chart.earth[5]}`,'qimen-cell-stems'),node('span',`随转至${api.PALACES[chart.carry.palace].name}`,'qimen-cell-carry'));}
            else{
                const head=node('span',undefined,'qimen-cell-head'),tags=[];
                if(chart.voids.some(z=>p.branches.includes(z)))tags.push('空');if(p.branches.includes(chart.horse))tags.push('马');
                head.append(node('span',`${p.name} · ${p.direction}`),node('span',tags.join(' '),'qimen-cell-tags'));
                const door=node('span',undefined,'qimen-cell-door');door.append(node('span',chart.doors[n]));
                if(reading.self===n)door.append(node('small',personal?'年命':'日干','qimen-cell-person'));
                const stems=node('span',undefined,'qimen-cell-stems');stems.append(node('span','天'),node('b',chart.sky[n]),node('span','地'),node('b',chart.earth[n]));
                cell.append(head,node('span',chart.gods[n],'qimen-cell-god'),node('span',chart.stars[n]+(chart.carry.palace===n?' · 禽':''),'qimen-cell-star'),door,stems);
                if(chart.carry.palace===n)cell.append(node('span',`天寄 ${chart.carry.stem}`,'qimen-cell-carry'));
                if(n===2)cell.append(node('span',`地寄 ${chart.earth[5]}`,'qimen-cell-carry'));
            }
            cell.addEventListener('click',()=>renderPalace(n));board.append(cell);
        }
        write('qimenReadingTitle',`${profile.name?profile.name+'的':''}${reading.topic.name}`);
        $('qimenQuestionDisplay').hidden=!question;write('qimenQuestionDisplay',question?`所问：${question}`:'');
        const selfLabel=personal?`出生年命${profile.pillar}`:`本局日干${chart.pillars.day[0]}`;
        write('qimenFocus',`${selfLabel}落${api.PALACES[reading.self].name}宫；本次以${reading.topic.symbol}所在的${api.PALACES[reading.target].name}宫看事。`);
        write('qimenComparison',reading.comparison);
        const steps=[
            `以北京时间 ${chart.datetime.replace('T',' ')} 起局。当前节气为${chart.termName}，交节时刻 ${chart.termAt}；下一交节 ${chart.nextTermAt}。`,
            `日柱${chart.pillars.day}，回溯到甲己符头${chart.fuHead}，取${chart.yuan}；按${chart.termName}用局表，得${chart.yang?'阳':'阴'}遁${chart.ju}局。`,
            `以戊、己、庚、辛、壬、癸、丁、丙、乙，${chart.yang?'顺':'逆'}布九宫地盘。${chart.xun}遁${chart.hiddenStem}，原落${api.PALACES[chart.originalChief].name}宫，定值符${chart.chiefStar}、值使${chart.chiefDoor}。`,
            `值符随时干，转至${api.PALACES[chart.chiefStarPalace].name}宫；值使随旬内时序，落${api.PALACES[chart.chiefDoorPalace].name}宫${chart.rawDoorPalace===5?'（原入中五，寄坤二）':''}。天禽与中五干随天芮寄转；八神${chart.yang?'顺':'逆'}排。`,
            personal?`个人层：${profile.birthDate}${profile.birthTime?' '+profile.birthTime:''}，按立春分年得${profile.pillar}年命，取其天干在本时盘的落宫。${profile.pillar[0]==='甲'?'甲年按其年旬所遁六仪定位。':''}姓名、性别不改变时盘。`:'未填出生日期，本次采用起局日干落宫作为自身参考。',
            `${reading.topic.why} 所问文字是留笺，不作语义测算；白话解读由本局门、星、宫关系生成。`
        ];
        if(chart.starEcho||chart.doorEcho||chart.starOpposite||chart.doorOpposite)steps.push(`本局另见${[chart.starEcho?'星盘伏吟':'',chart.doorEcho?'门盘伏吟':'',chart.starOpposite?'星盘反吟':'',chart.doorOpposite?'门盘反吟':''].filter(Boolean).join('、')}；本页列示这些盘面现象，不凭一项独断吉凶。`);
        $('qimenSteps').replaceChildren(...steps.map(text=>node('li',text)));
        $('qimenResult').hidden=false;
        renderPalace(personal?reading.self:reading.target);
    }
    async function run({focus=false}={}) {
        const ticket=++generation;
        if(live.checked)time.value=nowBeijing();
        const chosenTime=time.value,profileValues=values(),topic=$('qimenTopic').value,question=$('qimenQuestion').value.trim();
        submit.disabled=true;submit.setAttribute('aria-busy','true');
        if(!window.Solar)announce('正在载入本地历法，准备起局…');
        try{
            const calendar=await loadCalendar();if(ticket!==generation)return;
            const chart=api.buildChart(chosenTime,calendar),profile=api.profileFor(chart,profileValues,calendar);
            const signature=JSON.stringify({pillars:chart.pillars,term:chart.termName,ju:chart.ju,profile,topic,question});
            if(signature!==lastSignature){render(chart,profile,topic,question);lastSignature=signature;}else if(current){current.chart=chart;$('qimenSteps').firstElementChild.textContent=`以北京时间 ${chart.datetime.replace('T',' ')} 起局。当前节气为${chart.termName}，交节时刻 ${chart.termAt}；下一交节 ${chart.nextTermAt}。`;}
            write('qimenResultTime',`${live.checked?'此刻':'指定时刻'} / ${chosenTime.replace('T',' ')} · 北京时间`);
            announce(live.checked?`随时更新 · ${chart.pillars.hour}时。跨时辰、换日或交节时重新起局。`:'已按指定时刻起局。点「回到此刻」恢复随时间更新。');
            if(focus){$('qimenJu').focus({preventScroll:true});$('qimenResult').scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth'});}
        }catch(error){if(ticket===generation){current=null;lastSignature='';$('qimenResult').hidden=true;announce(error.message||'这次未能起局，请检查日期后重试。',true);}}
        finally{if(ticket===generation){submit.disabled=false;submit.setAttribute('aria-busy','false');}}
    }
    function schedule() {
        clearTimeout(timer);
        if(document.hidden||!live.checked)return;
        timer=setTimeout(async()=>{if(!document.hidden&&live.checked)await run();schedule();},60000-Date.now()%60000+100);
    }
    form.addEventListener('submit',event=>{event.preventDefault();if(form.reportValidity())run({focus:true}).then(schedule);});
    time.addEventListener('input',()=>{live.checked=false;schedule();announce('已切换到指定时刻；点击「起一局」查看。');});
    live.addEventListener('change',()=>{if(live.checked)run().then(schedule);else{schedule();announce('当前时盘已停留，可以修改时间后起局。');}});
    $('qimenNow').addEventListener('click',()=>{live.checked=true;run().then(schedule);});
    $('qimenSave').addEventListener('click',()=>{
        if(!current)return;
        const {chart,profile,reading,question}=current;
        const personal=profile.palace?`${profile.name||'未留名'} / ${profile.gender} / ${profile.age}周岁 / ${profile.pillar}年命`:'共同时盘';
        const rows=api.ORDER.map(n=>n===5?`中五：地盘${chart.earth[5]}，随天禽寄${api.PALACES[chart.carry.palace].name}`:`${api.PALACES[n].name} ${chart.gods[n]} ${chart.stars[n]} ${chart.doors[n]} 天${chart.sky[n]} 地${chart.earth[n]}${chart.carry.palace===n?' 天寄'+chart.carry.stem:''}`);
        const contents=[`奇门 · 观局 / ${chart.datetime.replace('T',' ')} 北京时间`,personal,question?'所问：'+question:'',`${chart.yang?'阳':'阴'}遁${chart.ju}局 ${chart.yuan} ${chart.termName}`,`四柱：${Object.values(chart.pillars).join(' ')}`,`用神：${reading.topic.symbol}；${reading.comparison}`,...rows,'',...$('qimenSteps').querySelectorAll('li')].map(line=>typeof line==='string'?line:line.textContent);
        contents.push('','传统术数规则内的基础读盘，白话为本站归纳。来源：https://zh.wikisource.org/zh-hans/奇門遁甲統宗');
        const url=URL.createObjectURL(new Blob([contents.join('\n')],{type:'text/plain;charset=utf-8'})),link=node('a');link.href=url;link.download=`奇门观局_${chart.datetime.replace(/[-:T]/g,'')}.txt`;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);announce('本局文字已生成，可在浏览器下载中查看。');
    });
    document.addEventListener('visibilitychange',()=>{if(document.hidden)clearTimeout(timer);else if(live.checked)run().then(schedule);});
    addEventListener('pagehide',()=>clearTimeout(timer));
    addEventListener('pageshow',event=>{if(event.persisted&&live.checked)run().then(schedule);});
    time.value=nowBeijing();submit.disabled=false;run().then(schedule);
})();
