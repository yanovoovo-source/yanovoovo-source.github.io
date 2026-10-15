/* Time-based rotating Qimen. Calendar supplied by the MIT lunar-javascript library.
   Rules and the chosen conventions are documented in tools/QIMEN.md. */
(function (root, factory) {
    const api = factory();
    if (typeof module === 'object' && module.exports) module.exports = api;
    else root.JianghuQimen = api;
})(globalThis, function () {
    'use strict';
    const GAN = [...'甲乙丙丁戊己庚辛壬癸'], ZHI = [...'子丑寅卯辰巳午未申酉戌亥'];
    const RING = [1,8,3,4,9,2,7,6], ORDER = [4,9,2,3,5,7,8,1,6];
    const STEMS = [...'戊己庚辛壬癸丁丙乙'];
    const PALACES = {
        1:{name:'坎一',direction:'北',element:'水',branches:'子'},
        2:{name:'坤二',direction:'西南',element:'土',branches:'未申'},
        3:{name:'震三',direction:'东',element:'木',branches:'卯'},
        4:{name:'巽四',direction:'东南',element:'木',branches:'辰巳'},
        5:{name:'中五',direction:'中',element:'土',branches:''},
        6:{name:'乾六',direction:'西北',element:'金',branches:'戌亥'},
        7:{name:'兑七',direction:'西',element:'金',branches:'酉'},
        8:{name:'艮八',direction:'东北',element:'土',branches:'丑寅'},
        9:{name:'离九',direction:'南',element:'火',branches:'午'}
    };
    const ORIGINAL_STARS = {1:'天蓬',2:'天芮',3:'天冲',4:'天辅',5:'天禽',6:'天心',7:'天柱',8:'天任',9:'天英'};
    const ORIGINAL_DOORS = {1:'休门',2:'死门',3:'伤门',4:'杜门',6:'开门',7:'惊门',8:'生门',9:'景门'};
    const GODS = ['值符','腾蛇','太阴','六合','白虎','玄武','九地','九天'];
    const TERM_JU = {
        冬至:[1,7,4],小寒:[2,8,5],大寒:[3,9,6],立春:[8,5,2],雨水:[9,6,3],惊蛰:[1,7,4],
        春分:[3,9,6],清明:[4,1,7],谷雨:[5,2,8],立夏:[4,1,7],小满:[5,2,8],芒种:[6,3,9],
        夏至:[9,3,6],小暑:[8,2,5],大暑:[7,1,4],立秋:[2,5,8],处暑:[1,4,7],白露:[9,3,6],
        秋分:[7,1,4],寒露:[6,9,3],霜降:[5,8,2],立冬:[6,9,3],小雪:[5,8,2],大雪:[4,7,1]
    };
    const YANG_TERMS = ['冬至','小寒','大寒','立春','雨水','惊蛰','春分','清明','谷雨','立夏','小满','芒种'];
    const GENERATES = {木:'火',火:'土',土:'金',金:'水',水:'木'};
    const CONTROLS = {木:'土',土:'水',水:'火',火:'金',金:'木'};
    const DOORS = {
        休门:{element:'水',theme:'休整、交流',advice:'留出缓冲，先沟通，再安排节奏。'},
        生门:{element:'土',theme:'积累、经营',advice:'把手边可用的资源和下一步列清楚。'},
        伤门:{element:'木',theme:'行动、摩擦',advice:'行动前明确边界，给争执和返工留余地。'},
        杜门:{element:'木',theme:'专注、守密',advice:'适合先做准备，把尚未成熟的想法理顺。'},
        景门:{element:'火',theme:'表达、呈现',advice:'整理文字与成果，也检查表达是否准确。'},
        死门:{element:'土',theme:'收束、整理',advice:'先处理积压与收尾，给新计划腾出空间。'},
        惊门:{element:'金',theme:'消息、分歧',advice:'先核实消息，把口头约定说清楚。'},
        开门:{element:'金',theme:'开展、联络',advice:'可以先敲开一扇门，用一个小步骤推进。'}
    };
    const STARS = {
        天蓬:['水','探索与流动','把问题的范围和手里的信息弄清楚。'],
        天芮:['土','检查与修整','检查遗漏，先修补，再推进。'],
        天冲:['木','行动与速度','给行动配一个清楚的步骤，减少冲动。'],
        天辅:['木','学习与条理','整理材料、请教、复盘，逐步形成自己的方法。'],
        天心:['金','规划与取舍','把选项和取舍写下来，再做决定。'],
        天柱:['金','表达与分歧','把模糊的话说具体，确认彼此理解一致。'],
        天任:['土','积累与落实','从稳定、能完成的小事开始。'],
        天英:['火','呈现与关注','把成果表达清楚，也给自己留出检查时间。']
    };
    const GOD_MEANINGS = {值符:'统筹与主导',腾蛇:'反复与疑虑',太阴:'细节与内在',六合:'合作与联结',白虎:'执行与摩擦',玄武:'隐情与信息',九地:'沉稳与积累',九天:'展开与远望'};
    const TOPICS = {
        overview:{name:'当下运势',symbol:'时干',why:'以时干落宫看当下所问之事；自身参考日干，填出生日期后改看年命。'},
        work:{name:'工作推进',symbol:'开门',why:'本页以开门作为工作开展、联络与推进的参考用神。'},
        study:{name:'学习创作',symbol:'天辅',why:'本页以天辅星作为学习、资料与条理的参考用神。'},
        social:{name:'人际沟通',symbol:'六合',why:'本页以六合作为合作与关系联结的参考用神。'},
        travel:{name:'出行安排',symbol:'开门',why:'本页以开门参考出行安排，另列时支驿马供读盘。'}
    };
    const mod = (n,m) => ((n % m) + m) % m;
    const host = palace => palace === 5 ? 2 : palace;
    const palaceName = n => `${PALACES[n].name}宫`;
    function parseTime(value) {
        const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value || '');
        if (!match) throw new Error('请填写完整的年月日和时分。');
        const [year,month,day,hour,minute] = match.slice(1).map(Number);
        const date = new Date(Date.UTC(year,month-1,day,hour,minute));
        if(year<1900||year>2100||date.getUTCFullYear()!==year||date.getUTCMonth()!==month-1||date.getUTCDate()!==day||hour>23||minute>59) throw new Error('请选择 1900 至 2100 年之间的有效日期与时间。');
        return {year,month,day,hour,minute};
    }
    function xunOf(pillar) {
        const offset = mod(ZHI.indexOf(pillar[1])-GAN.indexOf(pillar[0]),12);
        const index = [0,10,8,6,4,2].indexOf(offset);
        if(index<0)throw new Error('历法未返回有效的干支。');
        return {name:'甲'+ZHI[offset],stem:STEMS[index],voids:[ZHI[mod(offset+10,12)],ZHI[mod(offset+11,12)]]};
    }
    function buildChart(value, calendar) {
        const time = parseTime(value);
        const solar = calendar.Solar.fromYmdHms(time.year,time.month,time.day,time.hour,time.minute,0);
        const lunar = solar.getLunar();
        const pillars = {year:lunar.getYearInGanZhiExact(),month:lunar.getMonthInGanZhiExact(),day:lunar.getDayInGanZhiExact(),hour:lunar.getTimeInGanZhi()};
        const term = lunar.getPrevJieQi(false), nextTerm = lunar.getNextJieQi(false), termName = term.getName();
        if(!TERM_JU[termName])throw new Error('未能确定当前节气，请重新选择时间。');
        const dayGan = GAN.indexOf(pillars.day[0]), dayZhi = ZHI.indexOf(pillars.day[1]);
        const fuZhi = ZHI[mod(dayZhi-dayGan%5,12)];
        const yuanIndex = '子午卯酉'.includes(fuZhi) ? 0 : '寅申巳亥'.includes(fuZhi) ? 1 : 2;
        const fuHead = GAN[dayGan-dayGan%5]+fuZhi;
        const yang = YANG_TERMS.includes(termName), ju = TERM_JU[termName][yuanIndex];
        return {datetime:value,pillars,termName,termAt:term.getSolar().toYmdHms(),nextTermAt:nextTerm.getSolar().toYmdHms(),yang,ju,yuan:['上元','中元','下元'][yuanIndex],fuHead,...arrange(pillars,ju,yang)};
    }
    function arrange(pillars,ju,yang) {
        const direction=yang?1:-1;
        const earth = {}, sky = {}, stars = {}, doors = {}, gods = {};
        STEMS.forEach((stem,index)=>{earth[mod(ju-1+direction*index,9)+1]=stem;});
        const xun = xunOf(pillars.hour);
        const findEarth = stem => Number(Object.keys(earth).find(n=>earth[n]===stem));
        const originalChief = findEarth(xun.stem), chiefHost = host(originalChief);
        const hourStem = pillars.hour[0]==='甲' ? xun.stem : pillars.hour[0];
        const chiefStarPalace = host(findEarth(hourStem));
        const spin = mod(RING.indexOf(chiefStarPalace)-RING.indexOf(chiefHost),8);
        RING.forEach((source,index)=>{
            const target=RING[mod(index+spin,8)];
            sky[target]=earth[source];stars[target]=ORIGINAL_STARS[source];
        });
        const carryPalace=RING[mod(RING.indexOf(2)+spin,8)];
        const rawDoorPalace=mod(originalChief-1+direction*GAN.indexOf(pillars.hour[0]),9)+1;
        const chiefDoorPalace=host(rawDoorPalace);
        const doorSpin=mod(RING.indexOf(chiefDoorPalace)-RING.indexOf(chiefHost),8);
        RING.forEach((source,index)=>{doors[RING[mod(index+doorSpin,8)]]=ORIGINAL_DOORS[source];});
        GODS.forEach((god,index)=>{gods[RING[mod(RING.indexOf(chiefStarPalace)+direction*index,8)]]=god;});
        const hourZhi=pillars.hour[1];
        const horse='申子辰'.includes(hourZhi)?'寅':'寅午戌'.includes(hourZhi)?'申':'亥卯未'.includes(hourZhi)?'巳':'亥';
        return {
            earth,sky,stars,doors,gods,
            chiefStar:ORIGINAL_STARS[originalChief],chiefDoor:ORIGINAL_DOORS[chiefHost],chiefStarPalace,chiefDoorPalace,
            originalChief,rawDoorPalace,carry:{stem:earth[5],palace:carryPalace},xun:xun.name,hiddenStem:xun.stem,voids:xun.voids,horse,
            starEcho:spin===0,starOpposite:spin===4,doorEcho:doorSpin===0,doorOpposite:doorSpin===4
        };
    }
    function stemPalace(chart,pillar) {
        const stem = pillar[0]==='甲' ? xunOf(pillar).stem : pillar[0];
        return Number(Object.keys(chart.sky).find(n=>chart.sky[n]===stem)) || (chart.carry.stem===stem?chart.carry.palace:null);
    }
    function relation(a,b) {
        if(a===b)return '比和';
        if(GENERATES[a]===b)return '前生后';
        if(GENERATES[b]===a)return '后生前';
        if(CONTROLS[a]===b)return '前克后';
        return '后克前';
    }
    function readPalace(chart,n) {
        if(n===5)return {title:'中五 · 寄宫',theme:'中宫不单独排门、神',lines:[{label:'寄宫规则',evidence:`地盘${chart.earth[5]}随天禽寄转至${palaceName(chart.carry.palace)}。`,note:'本页天禽与天芮同转；查看对应外宫可见寄干。'}]};
        const palace=PALACES[n],door=DOORS[chart.doors[n]],star=STARS[chart.stars[n]],r=relation(door.element,palace.element);
        const texts={比和:['门宫比和',`${door.element}与${palace.element}同属一行。`,'用同一个节奏推进，重视稳定与落实。'],前生后:['门生宫',`${door.element}生${palace.element}。`,'把精力落实到具体事务，也留意付出与消耗。'],后生前:['宫生门',`${palace.element}生${door.element}。`,'整理已有条件，再把它们用于下一步。'],前克后:['门迫',`${door.element}克${palace.element}，门克宫。`,'先调节行动方式与环境之间的冲突，给事情留余地。'],后克前:['宫克门',`${palace.element}克${door.element}，门受到宫的制约。`,'先确认条件与限制，再决定推进幅度。']};
        const [label,explanation,note]=texts[r];
        const lines=[
            {label:'八门取象',evidence:`${chart.doors[n]} · ${door.theme}。`,note:door.advice},
            {label,evidence:`${chart.doors[n]}属${door.element}，${palaceName(n)}属${palace.element}；${explanation}`,note},
            {label:'九星取象',evidence:`${chart.stars[n]}属${star[0]}，参考${star[1]}。`,note:star[2]},
            {label:'八神取象',evidence:`${chart.gods[n]} · ${GOD_MEANINGS[chart.gods[n]]}。`,note:'这是一层传统象意，需要结合门、星和所问事项阅读。'}
        ];
        const empty=chart.voids.filter(branch=>palace.branches.includes(branch));
        if(empty.length)lines.push({label:'时旬空亡',evidence:`${chart.xun}旬空${chart.voids.join('、')}，本宫含${empty.join('、')}。`,note:'传统读盘借此提醒条件可能尚未落实；先核实消息与进展。'});
        if(palace.branches.includes(chart.horse))lines.push({label:'时支驿马',evidence:`${chart.pillars.hour[1]}时取驿马${chart.horse}，在本宫。`,note:'传统取移动、变化之象；可留意安排中的变动。'});
        return {title:`${palace.name} · ${palace.direction}`,theme:`${chart.doors[n]}：${door.theme}`,lines};
    }
    function profileFor(chart, values, calendar) {
        const profile={name:String(values.name||'').trim().slice(0,24),gender:['女','男'].includes(values.gender)?values.gender:'未填写',birthDate:values.birthDate||'',birthTime:values.birthTime||'',age:null,pillar:null,palace:null};
        if(!profile.birthDate)return profile;
        const birth=parseTime(profile.birthDate+'T'+(profile.birthTime||'12:00'));
        if(profile.birthDate>chart.datetime.slice(0,10))throw new Error('出生日期不能晚于起局日期。');
        const solar=calendar.Solar.fromYmdHms(birth.year,birth.month,birth.day,birth.hour,birth.minute,0),lunar=solar.getLunar();
        const spring=lunar.getJieQiTable()['立春'];
        if(!profile.birthTime&&spring&&spring.toYmd()===profile.birthDate)throw new Error('出生当天交立春，请补充出生时间，才能确定年命。');
        profile.pillar=lunar.getYearInGanZhiExact();
        profile.palace=stemPalace(chart,profile.pillar);
        profile.age=Number(chart.datetime.slice(0,4))-birth.year-(chart.datetime.slice(5,10)<profile.birthDate.slice(5)?1:0);
        return profile;
    }
    function analyze(chart,topicKey='overview',profile=null) {
        const topic=TOPICS[topicKey] || TOPICS.overview,self=profile?.palace||stemPalace(chart,chart.pillars.day);
        let target;
        if(topicKey==='overview'||!TOPICS[topicKey])target=stemPalace(chart,chart.pillars.hour);
        else if(topic.symbol==='开门')target=Number(Object.keys(chart.doors).find(n=>chart.doors[n]===topic.symbol));
        else if(topic.symbol==='天辅')target=Number(Object.keys(chart.stars).find(n=>chart.stars[n]===topic.symbol));
        else target=Number(Object.keys(chart.gods).find(n=>chart.gods[n]===topic.symbol));
        const reading=readPalace(chart,target),a=PALACES[target].element,b=PALACES[self].element,r=relation(a,b);
        const comparisons={比和:'事宫与自身宫比和，白话上可先追求节奏一致。',前生后:'事宫生自身宫，白话上可先整理外部能提供的支持。',后生前:'自身宫生事宫，白话上要看清自己需要投入的精力。',前克后:'事宫克自身宫，白话上先处理外部条件带来的压力。',后克前:'自身宫克事宫，白话上先明确推进边界，避免用力过度。'};
        return {topic,topicKey:TOPICS[topicKey]?topicKey:'overview',self,target,reading,comparison:`${palaceName(target)}属${a}，${profile?.palace?'年命':'日干'}落${palaceName(self)}属${b}。${comparisons[r]}`};
    }
    return {buildChart,arrange,parseTime,profileFor,analyze,readPalace,stemPalace,xunOf,PALACES,ORDER,TOPICS,TERM_JU};
});
