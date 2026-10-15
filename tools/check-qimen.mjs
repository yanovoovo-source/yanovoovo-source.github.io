import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const require=createRequire(import.meta.url);
const api=require('../qimen-core.js'),calendar=require('../assets/vendor/lunar.js');
const build=value=>api.buildChart(value,calendar);
if(process.argv.includes('--tz-probe')){console.log(JSON.stringify(build('2026-10-15T14:30')));process.exit(0);}
const ring=[1,8,3,4,9,2,7,6],order=[4,9,2,3,7,8,1,6];
const inOrder=values=>order.map(n=>values[n]);
// Ancient worked rule: yang 1, 乙丑时 -> 天蓬加离九，休门加坤二.
let p=api.arrange({day:'甲子',hour:'乙丑'},1,true);
assert.equal(p.chiefStar,'天蓬');assert.equal(p.chiefStarPalace,9);assert.equal(p.chiefDoor,'休门');assert.equal(p.chiefDoorPalace,2);
// Independently worked rotating-plate fixtures, also published by arc119226/qimen_dunjia.
p=api.arrange({day:'戊午',hour:'庚申'},5,true);
assert.equal(p.chiefStarPalace,7);assert.equal(p.chiefDoorPalace,7);
assert.deepEqual(inOrder(p.sky),['丁','庚','己','壬','癸','乙','丙','辛']);
assert.deepEqual(inOrder(p.stars),['天芮','天柱','天心','天英','天蓬','天辅','天冲','天任']);
assert.deepEqual(inOrder(p.doors),['死门','惊门','开门','景门','休门','杜门','伤门','生门']);
p=api.arrange({day:'丁巳',hour:'辛亥'},3,false);
assert.equal(p.chiefStarPalace,9);assert.equal(p.chiefDoorPalace,1);
assert.deepEqual(inOrder(p.sky),['庚','壬','戊','丁','乙','癸','己','辛']);
assert.deepEqual(inOrder(p.doors),['景门','死门','惊门','杜门','开门','伤门','生门','休门']);
assert.deepEqual(inOrder(p.gods),['腾蛇','值符','九天','太阴','九地','六合','白虎','玄武']);
p=api.arrange({day:'己未',hour:'壬戌'},1,true);
assert.equal(p.chiefStarPalace,2);assert.equal(p.rawDoorPalace,5);assert.equal(p.chiefDoorPalace,2);
p=api.arrange({day:'戊辰',hour:'甲午'},7,true);
assert.ok(p.starEcho&&p.doorEcho);assert.equal(p.hiddenStem,'辛');
console.log('PASS ancient worked rule / independent yang and yin plates / middle-palace hosting / hidden Jia');

const known=build('2026-05-27T10:30');
assert.deepEqual(known.pillars,{year:'丙午',month:'癸巳',day:'辛丑',hour:'癸巳'});
assert.equal(known.termName,'小满');assert.equal(known.ju,2);assert.equal(known.yuan,'中元');assert.equal(known.chiefStar,'天辅');assert.equal(known.chiefDoor,'杜门');
assert.deepEqual(build('2026-10-15T14:01').sky,build('2026-10-15T14:59').sky);
assert.notDeepEqual(build('2026-10-15T14:59').sky,build('2026-10-15T15:00').sky);
assert.notEqual(build('2026-10-15T12:00').pillars.day,build('2026-10-16T12:00').pillars.day);
assert.notEqual(build('2026-10-15T22:59').pillars.day,build('2026-10-15T23:00').pillars.day);
assert.deepEqual(build('2026-10-15T23:00').pillars,build('2026-10-16T00:00').pillars);
// Cross the actual astronomical solstice; input precision is one minute.
const summer=calendar.Solar.fromYmd(2026,6,21).getLunar().getJieQiTable()['夏至'];
const summerMinute=summer.toYmdHms().slice(0,16).replace(' ','T');
const nextMinute=new Date(Date.parse(summerMinute+'Z')+60000).toISOString().slice(0,16);
assert.equal(build(summerMinute).yang,true);assert.equal(build(nextMinute).yang,false);
assert.equal(build(nextMinute).termName,'夏至');
console.log('PASS known calendar fixture / same double-hour / next double-hour / daily change / 23:00 day change / exact solar-term boundary');

const chart=build('2026-10-15T14:30');
const a=api.profileFor(chart,{name:'甲',gender:'女',birthDate:'1993-06-01'},calendar);
const b=api.profileFor(chart,{name:'乙',gender:'男',birthDate:'1995-06-01'},calendar);
assert.equal(a.age,33);assert.notEqual(a.pillar,b.pillar);assert.notEqual(a.palace,b.palace);
assert.notEqual(api.analyze(chart,'work',a).comparison,api.analyze(chart,'work',b).comparison);
assert.equal(api.profileFor(chart,{name:'其他名',gender:'男',birthDate:'1993-06-01'},calendar).palace,a.palace);
assert.equal(api.profileFor(chart,{birthDate:'1993-12-01'},calendar).age,32);
assert.throws(()=>api.profileFor(chart,{birthDate:'2027-01-01'},calendar));
const spring=calendar.Solar.fromYmd(1993,2,4).getLunar().getJieQiTable()['立春'];
assert.throws(()=>api.profileFor(chart,{birthDate:spring.toYmd()},calendar),/立春/);
for(const topic of Object.keys(api.TOPICS)){const read=api.analyze(chart,topic,a);assert.ok(ring.includes(read.target));assert.equal(read.self,a.palace);assert.ok(read.comparison);}
console.log('PASS personal year-stem palaces / personal reading / name and gender do not fabricate calculations / age / birth-date validation / spring boundary');

// A full 60-hour-stem cycle, both solstices, every season, both day boundaries.
for(const month of [1,2,3,4,5,6,7,8,9,10,11,12])for(const day of [1,6,11,16,21,26])for(const hour of [0,1,12,15,22,23]){
    const c=build(`2026-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}T${String(hour).padStart(2,'0')}:30`);
    assert.equal(new Set(Object.values(c.earth)).size,9);
    assert.equal(new Set(Object.values(c.doors)).size,8);
    assert.equal(new Set(Object.values(c.stars)).size,8);
    assert.equal(new Set(Object.values(c.gods)).size,8);
    assert.equal(c.doors[c.chiefDoorPalace],c.chiefDoor);
    assert.equal(c.gods[c.chiefStarPalace],'值符');
    assert.equal(c.stars[c.chiefStarPalace],c.chiefStar==='天禽'?'天芮':c.chiefStar);
    assert.equal(new Set([...Object.values(c.sky),c.carry.stem]).size,9);
    for(const palace of api.ORDER)assert.ok(api.readPalace(c,palace).lines.length);
    for(const topic of Object.keys(api.TOPICS))assert.ok(api.analyze(c,topic).comparison);
}
for(const bad of ['2026-02-30T12:00','2026-02-29T12:00','2026-10-15T24:00','2026-10-15T14:60','1800-01-01T00:00','bad'])assert.throws(()=>build(bad));
assert.equal(build('2024-02-29T12:00').datetime,'2024-02-29T12:00');
const probes=['UTC','America/New_York','Asia/Shanghai'].map(TZ=>{
    const run=spawnSync(process.execPath,[fileURLToPath(import.meta.url),'--tz-probe'],{env:{...process.env,TZ},encoding:'utf8'});
    assert.equal(run.status,0,run.stderr);return run.stdout.trim();
});
assert.equal(probes[0],probes[1]);assert.equal(probes[1],probes[2]);
console.log('PASS 432 seasonal/time fixtures / every palace and topic / invalid dates / leap day / UTC, New York and Shanghai host time zones');
