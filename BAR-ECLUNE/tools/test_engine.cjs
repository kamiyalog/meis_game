const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');const root=path.join(__dirname,'..');const scope={window:{}};vm.runInNewContext(fs.readFileSync(path.join(root,'data.js'),'utf8'),scope);const D=JSON.parse(JSON.stringify(scope.window.ECLUNE_DATA)),E=require('../engine.js');let checks=0;const check=(test,msg)=>{assert(test,msg);checks++;};
for(const first of ['紅','藍','翠'])for(const second of ['紅','藍','翠'].filter(x=>x!==first)){
 const s=E.newState(),r=E.newRecords();s.first=first;s.second=second;
 for(const routeKey of [first,first+'→'+second]){
  s.route=routeKey;s.done=[];s.runEvidence=[];check(!E.ready(s,r,D),routeKey+' gate initially closed');const pts=D.routes[routeKey].points;
  let todo=[...pts],progress=true;while(todo.length&&progress){progress=false;for(const p of [...todo])if(E.available(s,r,p)){E.acquire(s,r,p);todo=todo.filter(x=>x!==p);progress=true;}}
  check(todo.length===0,routeKey+' unlock graph completes');check(E.ready(s,r,D),routeKey+' return opens');
  const clone=JSON.parse(JSON.stringify(s));check(E.ready(clone,r,D),'serialized state preserves gate');
 }
 const evidenceCount=r.evidence.length;check(evidenceCount<=11,'no duplicate evidence');for(let a=0;a<2;a++)for(let b=0;b<4;b++)for(let c=0;c<4;c++){
  s.answers=[a,b,c];s.result=E.grade(s.answers,D.questions);const score=s.result.score;check(s.result.grade===(score===3?'PERFECT':score>0?'GOOD':'BAD'),'grade truth table');
  const lines=E.verdict(s,r,D);const corrections=lines.filter(x=>x.kind==='UI'&&x.text.startsWith('不正解。'));check(corrections.length===3-score,'only wrong questions corrected');
  check(lines.filter(x=>x.row===1173).length===1,'common truth once');check(!lines.some(x=>/\{Q\d/.test(x.text)),'no answer placeholder');
 }
 s.answers=D.questions.map(q=>q.correct);s.result=E.grade(s.answers,D.questions);E.finish(s,r);check(r.unlocked===2&&r.best==='PERFECT','unlock CASE02');s.result=E.grade([0,0,0],D.questions);E.finish(s,r);check(r.best==='PERFECT'&&r.evidence.length===evidenceCount,'best/evidence persistence');
 const replay=E.newState();replay.route=first;check(E.ready(replay,r,D),'replay evidence remains');check(D.routes[first].points.every(p=>E.pointDone(replay,r,p.key)),'completed nodes revisited');
}
let s=E.newState(),r=E.newRecords();s.route='紅';for(const p of D.routes['紅'].points.filter(x=>['register','envelope','window','door'].includes(x.key)))E.acquire(s,r,p);check(E.ready(s,r,D),'red bag is optional');check(!r.evidence.includes('E04'),'bag not silently acquired');check(E.available(s,r,D.routes['紅'].points.find(p=>p.key==='bag')),'optional bag remains available');
// FIX source text is retained; only literal Excel escape sequences are decoded.
check(D.rows.length===1226,'source rows captured');const mapped=new Set();for(const rt of Object.values(D.routes))for(const p of rt.points)for(const row of p.rows)mapped.add(row.row);check(mapped.has(678)&&mapped.has(995)&&mapped.has(1032),'all routes represented');
console.log(JSON.stringify({passed:checks,day2Paths:6,answerCombinations:32,sourceRows:D.rows.length}));
