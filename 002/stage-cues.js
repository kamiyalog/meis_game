'use strict';
// Transient presentation only. Story progress remains in app.js.
window.StageCue=(()=>{
 const layer=document.getElementById('stageCue'),game=document.getElementById('game');
 let timer=0,generation=0,active=false;
 const emblem=`<svg class="inquisitor-mark" viewBox="0 0 240 260" aria-hidden="true"><defs><linearGradient id="markMetal" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#f3e9d5"/><stop offset=".45" stop-color="#9a9f9d"/><stop offset=".7" stop-color="#e0d7c6"/><stop offset="1" stop-color="#6a716f"/></linearGradient></defs><g fill="none" stroke="url(#markMetal)" stroke-linejoin="round"><path class="mark-shield" d="M120 12L208 45V133Q206 195 120 243Q34 195 32 133V45Z" stroke-width="2"/><path d="M120 23L198 52V133Q195 188 120 231Q45 188 42 133V52Z" stroke-width=".7" opacity=".55"/><g class="mark-rays" stroke-width="1.1"><path d="M120 40V66M83 47L94 72M53 67L75 84M187 67L165 84M157 47L146 72M49 131L71 126M191 131L169 126M64 162L83 147M176 162L157 147M97 181L104 158M143 181L136 158"/></g><path d="M120 59L182 160H58Z" stroke-width="1.4"/><path class="mark-eye" d="M52 112Q120 52 188 112Q120 172 52 112Z" stroke-width="2.4"/><circle cx="120" cy="112" r="23" stroke-width="1.3"/><circle cx="120" cy="112" r="8" fill="url(#markMetal)" stroke="none"/><path d="M109 180V207M120 174V220M131 180V207" stroke-width="1.5"/></g></svg>`;
 function cancel(){generation++;clearTimeout(timer);active=false;game.inert=false;layer.hidden=true;layer.className='';layer.innerHTML='';}
 function play(kind,number,done){
  cancel();active=true;game.inert=true;const token=generation;
  const start=kind==='start',finish=kind==='finish';
  layer.className='stage-cue cue-'+kind;layer.hidden=false;
  layer.innerHTML=start?`<div class="cue-start-content"><div class="seal-frame">${emblem}</div><div class="seal-creed" aria-hidden="true"><span>審問で嘘をつくことは罪</span><span>嘘を許すことなかれ</span><span>罪を許すことなかれ</span></div><div class="cue-rule"></div><p class="cue-kicker">INQUISITION</p><h2 class="cue-title">審問開始</h2><div class="cue-index">PHASE 01</div></div>`:finish?`<div class="cue-strip"><i></i><div><span class="cue-kicker">CLOSED</span><h2 class="cue-title">審問終了</h2></div><i></i></div>`:`<div class="cue-strip"><i></i><div><span class="cue-kicker">TESTIMONY</span><h2 class="cue-title">PHASE <b>${String(number).padStart(2,'0')}</b></h2><span class="cue-subtitle">供述確認</span></div><i></i></div>`;
  layer.setAttribute('aria-label',start?'審問開始':finish?'審問終了':`Phase ${number} 開始`);
  // Each cue has one completion timer; hidden tabs and reduced-motion still complete.
  timer=setTimeout(()=>{if(token!==generation)return;cancel();done();},start?3000:finish?1500:1700);
 }
 return {play,cancel,get active(){return active}};
})();
