(()=>{'use strict';
const config=window.ECLUNE_ACCESS||{enabled:true,password:'040050'};
let started=false;
function start(){if(started)return;started=true;document.getElementById('access-gate')?.remove();document.body.classList.remove('access-locked');const script=document.createElement('script');script.src='app.js';document.body.appendChild(script);}
if(!config.enabled){start();return;}
document.body.classList.add('access-locked');
const gate=document.createElement('section');gate.id='access-gate';
gate.innerHTML='<form id="access-form"><p class="access-brand">BAR ECLUNE</p><h1>パスワードを入力してください</h1><label for="access-password">パスワード</label><input id="access-password" type="password" inputmode="numeric" autocomplete="off" required autofocus><button type="submit">入る</button><p id="access-error" role="alert" aria-live="polite"></p><p class="access-fiction">この物語はフィクションです</p></form>';
document.body.appendChild(gate);
document.getElementById('access-form').addEventListener('submit',event=>{event.preventDefault();const input=document.getElementById('access-password');if(input.value===config.password){start();}else{document.getElementById('access-error').textContent='パスワードが違います。';input.value='';input.focus();}});
})();
