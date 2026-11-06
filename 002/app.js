'use strict';
const D=window.GAME_DATA,$=id=>document.getElementById(id),C=D.characters;
const clone=o=>JSON.parse(JSON.stringify(o));
const prefix=p=>Object.values(D.lines).filter(l=>l.id.startsWith(p)).map(l=>l.id);
const fresh=()=>({v:1,ci:0,pi:0,si:0,mode:'title',updated:{},found:{},results:[],queue:[],qi:0,after:'',end:0,initialIndex:0,cues:{}});
let state=fresh(),tab='profile',toastTimer,voiceToken=0;
const loadJSON=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key))??fallback}catch{return fallback}};
let volumes={master:1,voice:1,bgm:.45,characters:Array(8).fill(1),...loadJSON('shinmon-options',{})};
let door=new Audio('assets/se-014.mp3');let bgm=new Audio(),voice=new Audio();bgm.loop=true;let bgmName='',activeWho=0;
const saveOptions=()=>{try{localStorage.setItem('shinmon-options',JSON.stringify(volumes))}catch{toast('この環境では設定を保存できません。')}applyVolumes()};
function applyVolumes(){door.volume=Math.max(0,Math.min(1,volumes.master));bgm.volume=Math.max(0,Math.min(1,volumes.master*volumes.bgm));voice.volume=Math.max(0,Math.min(1,volumes.master*volumes.voice*(volumes.characters[activeWho]??1)))}
function music(n){if(n===bgmName)return;bgmName=n;bgm.pause();if(!n){bgm.removeAttribute('src');return}bgm.src=`assets/bgm-${n}.mp3`;applyVolumes();bgm.play().catch(()=>{});}
function stopVoice(){voiceToken++;voice.pause();voice.removeAttribute('src')}
function playVoice(id){stopVoice();const line=D.lines[id],url=window.VOICE_MANIFEST?.[id];if(!line||!url)return;activeWho=line.who;voice.src=url;applyVolumes();voice.play().catch(()=>{});}
const character=()=>C[state.ci];const phase=()=>character().phases[state.pi];const statement=()=>phase().statements[state.si];
const key=()=>`${state.ci}:${state.pi}`;const foundCount=i=>Object.keys(state.found).filter(k=>k.startsWith(i+':')).length;
const rank=i=>foundCount(i)===C[i].phases.length?'P':foundCount(i)>0?'G':'B';
const totalScore=()=>state.results.slice(0,6).reduce((n,r)=>n+({P:2,G:1,B:0}[r]??0),0);
const endFor=(score,r)=>score<=4?1:score<=7?2:r==='P'?5:r==='G'?4:3;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function toast(s){clearTimeout(toastTimer);$('toast').textContent=s;$('toast').classList.add('show');toastTimer=setTimeout(()=>$('toast').classList.remove('show'),2400)}
function autosave(){if(state.mode==='title')return;try{localStorage.setItem('shinmon-auto',JSON.stringify(state))}catch{}}
function showModal(html){$('modalContent').innerHTML=html;if(!$('modal').open)$('modal').showModal()}
function closeModal(){$('modal').close()}
$('closeModal').onclick=closeModal;
$('modal').addEventListener('click',e=>{if(e.target===$('modal'))closeModal()});
function lineId(){if(state.mode==='sequence')return state.queue[state.qi];if(state.mode==='initial')return phase().statements[state.initialIndex].id;if(state.mode==='review'){let s=statement();return state.updated[s.id]?s.detail:s.id}return null}
function portrait(who,expression){const idx=who===7?0:({'普通':0,'通常':0,'焦り':1,'怒り':2,'悲しみ':3,'悲しみ・寂しさ':3}[expression]??0);const path=`assets/${(who===7?'DAIGO':C[who].code).toLowerCase()}-${idx}.webp`;if($('portrait').getAttribute('src')!==path)$('portrait').src=path;$('portrait').alt=who===7?'蛇島大悟':C[who].name;}
function renderNow(speak=true){
 $('dialogue').classList.remove('testimony-pulse','testimony-updated');
 const title=state.mode==='title',end=state.mode==='ending';$('titleScreen').hidden=!title;$('ending').hidden=!end;$('dialogue').hidden=title||end;$('portrait').hidden=title||end;$('file').hidden=title||end||D.lines[lineId()]?.who===7;$('finish').hidden=state.mode!=='review';$('heading').textContent=title||end?'':D.lines[lineId()]?.who===7?'廊下 ／ 蛇島大悟':`審問 ／ ${character().name}`;$('scene').style.backgroundImage=`url('assets/${end?'end'+state.end:D.lines[lineId()]?.who===7?'corridor':'room'}.webp')`;
 $('continue').disabled=!loadJSON('shinmon-auto',null)&&!loadJSON('shinmon-slot-1',null);
 if(title){$('file').hidden=true;music('');return}if(end){renderEnding();return}
 const id=lineId(),line=D.lines[id];if(!line)throw Error('台詞が見つかりません: '+id);
 $('portrait').classList.toggle('senior',line.who===7);portrait(line.who,line.expression);$('speaker').textContent=line.who===7?'蛇島大悟':C[line.who].name;$('text').textContent=line.text;$('text').scrollTop=0;
 const review=state.mode==='review',initial=state.mode==='initial';
 const updated=review&&!!state.updated[statement().id];
 $('dialogue').classList.toggle('testimony-updated',updated);
 $('context').textContent=updated?'証言更新済み':review?'供述確認':initial?'供述':'会話';
 $('previous').hidden=!review;$('nextStatement').hidden=!review;$('counter').hidden=!review&&!initial;$('counter').textContent=`${String((initial?state.initialIndex:state.si)+1).padStart(2,'0')} / ${String(phase().statements.length).padStart(2,'0')}`;
 $('previous').disabled=state.si===0;$('nextStatement').disabled=state.si===phase().statements.length-1;
 $('detail').hidden=!review;$('accuse').hidden=!review;$('advance').hidden=true;
 if(review){$('detail').disabled=!!state.updated[statement().id];$('detail').textContent=state.updated[statement().id]?'詳しく聞く（確認済み）':'詳しく聞く';}
 if(speak)playVoice(id);autosave();
}
function sequence(ids,after){if(!ids.length)throw Error('空の会話: '+after);state.mode='sequence';state.queue=ids;state.qi=0;state.after=after;render()}
function intro(first=false){const code=character().code;let q=first?prefix('DAIGO-OPEN-'):[];q.push(...prefix(`DAIGO-${code}-IN-`));if(first)q.push(...prefix('DAIGO-TUTORIAL-'));q.push(...prefix(`${code}-IN-`));sequence(q,'phase')}
function beginPhase(){state.mode='initial';state.initialIndex=0;state.si=0;music(state.ci===6&&state.pi>=4?'007':'008');$('newDocs').hidden=false;render();if(phase().docs.length)toast('ファイルに資料が追加されました');}
function phaseReadyCue(){
 state.cues??={};const stamp=`${state.ci}:${state.pi}:ready`;
 if(state.cues[stamp]){playVoice(lineId());return;}
 state.cues[stamp]=true;stopVoice();autosave();
 StageCue.play(state.pi===0?'start':'phase',state.pi+1,()=>{playVoice(lineId());});
}
function advance(){if(transitioning||StageCue.active||$('modal').open)return;stopVoice();if(state.mode==='sequence'){if(++state.qi<state.queue.length){render();return}return dispatch(state.after)}if(state.mode==='initial'){if(++state.initialIndex<phase().statements.length){render();return}state.mode='review';state.si=0;render(false);phaseReadyCue();}}
function dispatch(action){switch(action){case'phase':beginPhase();break;case'review':state.mode='review';render();music(state.ci===6&&state.pi>=4?'007':'008');break;case'detail':{
 const current=statement();
 if(current.updates)state.updated[current.id]=true;
 state.mode='review';
 render(!!current.updates);
 if(current.updates){
  $('dialogue').classList.add('testimony-pulse');
  toast('証言が更新されました');
 }
 break;
}case'nextPhase':nextPhase();break;case'afterSuspect':afterSuspect();break;case'nextCharacter':state.ci++;state.pi=0;state.si=0;intro();break;case'calculate':if(totalScore()<8)showEnding(endFor(totalScore(),'B'));else sequence(prefix('DAIGO-UNLOCK-'),'unlock');break;case'unlock':state.ci=6;state.pi=0;intro();break;case'finalEnd':showEnding(endFor(totalScore(),rank(6)));break;}}
function nextPhase(){if(StageCue.active)return;state.pi++;state.si=0;if(state.pi<character().phases.length)beginPhase();else{state.pi--;const r=rank(state.ci);state.results[state.ci]=r;state.mode='sequence';state.queue=prefix(`${character().code}-END-${r}`);state.qi=0;state.after='afterSuspect';state.cues??={};state.cues[`${state.ci}:finish`]=true;autosave();StageCue.play('finish',0,()=>{render();toast(({P:'PERFECT',G:'GOOD',B:'BAD…'})[r]);});}}
function afterSuspect(){const code=character().code,r=rank(state.ci);if(state.ci===6){const e=endFor(totalScore(),r);sequence(prefix(`DAIGO-END${e}-`),'finalEnd');return}let ids=prefix(`DAIGO-${code}-${r}`);if(state.ci===5){ids.push(...prefix('DAIGO-RESULT-'));sequence(ids,'calculate')}else sequence(ids,'nextCharacter')}
function detailed(){if(StageCue.active)return;if(state.mode!=='review'||state.updated[statement().id])return;sequence([statement().detail],'detail')}
function correctChoice(s,choice,updated){return s.correct===choice&&s.correct>=0&&(!s.requiresDetail||updated)}
function accuse(){if(StageCue.active)return;if(state.mode!=='review')return;const s=statement(),l=D.lines[state.updated[s.id]?s.detail:s.id];showModal(`<h2>嘘を指摘する</h2><p class="quote">${esc(l.text)}</p><p class="quiet">食い違っている点を選んでください。</p><div class="choices">${s.choices.map((c,i)=>`<button data-choice="${i}">${esc(c)}</button>`).join('')}</div><p class="quiet">「閉じる」で供述に戻ります。</p>`);document.querySelectorAll('[data-choice]').forEach(b=>b.onclick=()=>choose(+b.dataset.choice));}
function choose(i){if(StageCue.active)return;const s=statement();closeModal();music('007');if(correctChoice(s,i,!!state.updated[s.id])){state.found[key()]=true;toast('指摘成功');sequence(prefix(`${character().code}-P${state.pi+1}-S`),'nextPhase')}else sequence(prefix(`${character().code}-F-`),'review');}
function finish(){if(StageCue.active)return;if(state.mode!=='review')return;showModal('<h2>会話を終了しますか？</h2><p>一度終了するとこの会話については言及できません。<br>本当によろしいですか？<br>嘘は、もうありませんか？</p><div class="confirmActions"><button id="cancelFinish">いいえ</button><button class="red" id="confirmFinish">はい</button></div>');$('cancelFinish').onclick=closeModal;$('confirmFinish').onclick=()=>{closeModal();stopVoice();nextPhase()}}
function fileView(t='profile'){tab=t;$('newDocs').hidden=true;const c=character();const docs=c.phases.slice(0,state.pi+1).flatMap(p=>p.docs);const lies=c.phases.map((p,i)=>({p,i})).filter(x=>state.found[`${state.ci}:${x.i}`]);showModal(`<h2>審問資料 ／ ${esc(c.name)}</h2><div class="tabs"><button data-tab="profile" class="${t==='profile'?'selected':''}">人物情報</button><button data-tab="docs" class="${t==='docs'?'selected':''}">事件資料</button><button data-tab="lies" class="${t==='lies'?'selected':''}">暴いた嘘</button></div>${t==='profile'?`<div class="doc"><h3>プロフィール</h3><p>${esc(c.profile)}</p></div><div class="doc"><h3>容疑</h3><p>${esc(c.charge)}</p></div>`:t==='docs'?docs.map(d=>`<article class="doc"><h3>${esc(d.title)}</h3><p>${esc(d.text)}</p></article>`).join('')||'<p>資料はまだありません。</p>':lies.map(x=>`<article class="doc"><h3>記録 ${x.i+1}</h3><p>${esc(x.p.fact)}</p></article>`).join('')||'<p>暴いた嘘はまだありません。</p>'}`);document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>fileView(b.dataset.tab));}
function menu(){showModal(`<h2>メニュー</h2><div class="menuGrid"><button id="saveMenu" ${state.mode==='title'?'disabled':''}>セーブ</button><button id="loadMenu">ロード</button><button id="optionsMenu">オプション</button><button id="replay" ${lineId()?'':'disabled'}>ボイス再生</button><button id="backTitle">タイトルへ</button></div>`);$('saveMenu').onclick=()=>saveMenu();$('loadMenu').onclick=()=>saveMenu(true);$('optionsMenu').onclick=options;$('replay').onclick=()=>{const id=lineId();closeModal();if(id)playVoice(id)};$('backTitle').onclick=()=>{showModal('<h2>タイトルへ戻りますか？</h2><p>現在の進行はオートセーブされています。</p><div class="confirmActions"><button id="stay">戻らない</button><button id="goTitle">タイトルへ</button></div>');$('stay').onclick=menu;$('goTitle').onclick=()=>{closeModal();cancelTransition();stopVoice();state=fresh();render()}};}
function saveMenu(loading=false){const slots=[1,2,3];showModal(`<h2>${loading?'ロード':'セーブ'}</h2><div class="choices">${loading?'<button data-slot="auto">オートセーブ</button>':''}${slots.map(n=>{const v=loadJSON('shinmon-slot-'+n,null);return`<button data-slot="${n}">スロット ${n}　${v?esc(v.label)+' ／ '+esc(v.time):'データなし'}</button>`}).join('')}</div><p class="quiet">保存先は、このブラウザーです。</p>`);document.querySelectorAll('[data-slot]').forEach(b=>b.onclick=()=>{const n=b.dataset.slot;if(loading){const saved=loadJSON(n==='auto'?'shinmon-auto':'shinmon-slot-'+n,null);if(!saved){toast('保存データがありません');return}restore(saved.state??saved)}else{const old=loadJSON('shinmon-slot-'+n,null);const doSave=()=>{try{localStorage.setItem('shinmon-slot-'+n,JSON.stringify({state:clone(state),time:new Date().toLocaleString('ja-JP'),label:`${character().name} ／ 供述 ${state.pi+1}`}));closeModal();toast('セーブしました')}catch{toast('セーブできません。保存容量を確認してください。')}};if(old){showModal('<h2>上書きしますか？</h2><p>このスロットの保存データを上書きします。</p><div class="confirmActions"><button id="noOverwrite">いいえ</button><button id="yesOverwrite">はい</button></div>');$('noOverwrite').onclick=()=>saveMenu();$('yesOverwrite').onclick=doSave}else doSave()}});}
function validState(s){return s&&s.v===1&&Number.isInteger(s.ci)&&s.ci>=0&&s.ci<7&&Number.isInteger(s.pi)&&s.pi>=0&&s.pi<C[s.ci].phases.length&&['sequence','initial','review','ending'].includes(s.mode)&&Array.isArray(s.queue)&&s.queue.every(id=>D.lines[id])&&s.updated&&s.found&&Array.isArray(s.results)&&Number.isInteger(s.si)&&s.si>=0&&s.si<C[s.ci].phases[s.pi].statements.length&&(s.mode!=='sequence'||(s.qi>=0&&s.qi<s.queue.length))&&(s.mode!=='initial'||(s.initialIndex>=0&&s.initialIndex<C[s.ci].phases[s.pi].statements.length))&&(s.mode!=='ending'||s.end>=1&&s.end<=5)}
function restore(s){if(!validState(s)){toast('保存データを読み込めません');return}closeModal();cancelTransition();stopVoice();state=clone(s);visualPlace=null;music(state.mode==='ending'?'':state.ci===6&&state.pi>=4?'007':'008');render();}
function options(){let controls=[['全体音量','master'],['ボイス全体','voice'],['BGM','bgm'],...D.stats.map((s,i)=>[s.name,'char'+i])];showModal(`<h2>オプション</h2><div class="sliders">${controls.map(([name,id])=>{let v=id.startsWith('char')?volumes.characters[+id.slice(4)]:volumes[id];return`<label for="vol-${id}"><span>${name}</span><input id="vol-${id}" data-volume="${id}" type="range" min="0" max="100" step="1" value="${Math.round(v*100)}"><output for="vol-${id}">${Math.round(v*100)}%</output></label>`}).join('')}</div><p class="quiet">各キャラのボイス音量には「全体音量」と「ボイス全体」が掛かります。0%で消音。設定は自動保存されます。</p><button id="resetVolumes">音量を初期値に戻す</button>`);document.querySelectorAll('[data-volume]').forEach(input=>input.oninput=()=>{let k=input.dataset.volume,v=+input.value/100;if(k.startsWith('char'))volumes.characters[+k.slice(4)]=v;else volumes[k]=v;input.nextElementSibling.textContent=input.value+'%';saveOptions()});$('resetVolumes').onclick=()=>{volumes={master:1,voice:1,bgm:.45,characters:Array(8).fill(1)};saveOptions();options()};}
function credits(){showModal('<h2>クレジット</h2><p>審問の時間です。</p><p>制作：高無メイ</p><p class="quiet">本作はフィクションです。実在の人物・団体・事件とは関係ありません。</p><p class="notice">ボイス収録前の確認版です。音声は台詞IDに対応するファイルを登録して組み込めます。BGMは提供素材007・008を使用しています。入退室時のみ、扉のSE（se-014）を使用しています。</p>')}
function showEnding(n){state.mode='ending';state.end=n;stopVoice();music('');render();autosave();try{const a=loadJSON('shinmon-clears',[]);if(!a.includes(n)){a.push(n);localStorage.setItem('shinmon-clears',JSON.stringify(a))}}catch{}}
function renderEnding(){const e=D.ends[state.end-1];$('ending').innerHTML=`<div class="endNo">END ${String(state.end).padStart(2,'0')}</div><h2>${esc(e.share)}</h2><p>${e.text.map(esc).join('<br>')}</p><div class="endButtons"><button id="share">Xでシェア</button><button id="clearCredits">クレジット</button><button id="endTitle">タイトルへ</button></div>`;$('share').onclick=()=>{const text=e.share+'\nhttps://note.com/mei_takanashi/n/n5bf6e0814003\n#ホラー　#審問の時間です。';window.open('https://twitter.com/intent/tweet?text='+encodeURIComponent(text),'_blank','noopener,noreferrer')};$('clearCredits').onclick=credits;$('endTitle').onclick=()=>{state=fresh();render()};}
function start(){closeModal();cancelTransition();stopVoice();visualPlace='corridor';state=fresh();intro(true);music('008')}
$('start').onclick=()=>{if(loadJSON('shinmon-auto',null)){showModal('<h2>はじめから開始しますか？</h2><p>オートセーブは新しい進行に置き換わります。手動セーブは残ります。</p><div class="confirmActions"><button id="cancelStart">いいえ</button><button id="confirmStart">はい</button></div>');$('cancelStart').onclick=closeModal;$('confirmStart').onclick=start}else start()};
$('continue').onclick=()=>{const s=loadJSON('shinmon-auto',null)??loadJSON('shinmon-slot-1',null);if(s)restore(s.state??s)};
$('titleOptions').onclick=options;$('menu').onclick=()=>{if(!transitioning&&!StageCue.active)menu()};$('file').onclick=()=>{if(!transitioning&&!StageCue.active&&D.lines[lineId()]?.who!==7)fileView()};$('finish').onclick=finish;$('advance').onclick=advance;$('detail').onclick=detailed;$('accuse').onclick=accuse;
$('previous').onclick=()=>{if(!StageCue.active&&state.mode==='review'&&state.si>0){state.si--;render()}};$('nextStatement').onclick=()=>{if(!StageCue.active&&state.mode==='review'&&state.si<phase().statements.length-1){state.si++;render()}};
$('game').addEventListener('click',e=>{if(transitioning||StageCue.active||$('modal').open||e.target.closest('button,a,input,dialog,header,#titleScreen,#ending'))return;if(state.mode==='sequence'||state.mode==='initial')advance()});
document.addEventListener('keydown',e=>{if($('modal').open||transitioning||StageCue.active)return;if(e.key==='ArrowLeft'&&state.mode==='review')$('previous').click();if(e.key==='ArrowRight'&&state.mode==='review')$('nextStatement').click();if((e.key==='Enter'||e.key===' ')&&e.target===document.body&&(state.mode==='sequence'||state.mode==='initial')){e.preventDefault();advance()}});
document.addEventListener('visibilitychange',()=>{if(document.hidden){voice.pause();bgm.pause()}else if(bgmName&&state.mode!=='title'&&state.mode!=='ending')bgm.play().catch(()=>{})});
window.addEventListener('pagehide',autosave);
let visualPlace=null,transitioning=false,transitionGeneration=0;
function cancelTransition(){StageCue.cancel();transitionGeneration++;transitioning=false;$('roomTransition').classList.remove('black','active');$('menu').disabled=false;door.pause();}
function render(speak=true){
 const place=state.mode==='title'?'title':state.mode==='ending'?'ending':D.lines[lineId()]?.who===7?'corridor':'room';
 if(visualPlace&&['room','corridor'].includes(visualPlace)&&['room','corridor'].includes(place)&&visualPlace!==place){
  if(transitioning)return;
  transitioning=true;const generation=++transitionGeneration;stopVoice();$('menu').disabled=true;
  const layer=$('roomTransition');layer.classList.add('active');requestAnimationFrame(()=>layer.classList.add('black'));
  setTimeout(()=>{
   if(generation!==transitionGeneration)return;
   door.pause();door.currentTime=0;applyVolumes();door.play().catch(()=>{});
   visualPlace=place;renderNow(false);
   setTimeout(()=>{if(generation!==transitionGeneration)return;layer.classList.remove('black');
    setTimeout(()=>{if(generation!==transitionGeneration)return;layer.classList.remove('active');transitioning=false;$('menu').disabled=false;if(speak)playVoice(lineId());},420);
   },800);
  },420);
  return;
 }
 visualPlace=place;renderNow(speak);
}
render();
// Deterministic rules exposed for build verification, not UI controls.
window.ShinmonRules={rank,endFor,correctChoice,totalScore,validState};
