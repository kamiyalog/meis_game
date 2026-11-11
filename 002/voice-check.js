'use strict';
const byId = id => document.getElementById(id);
const gate = byId('voice-gate');
const role = byId('voice-role');
const player = byId('voice-player');
const status = byId('voice-status');
const {stats, lines} = window.GAME_DATA;
let playbackToken = 0;

function renderRole() {
 playbackToken++;
 player.pause();
 player.removeAttribute('src');
 player.load();
 player.hidden = true;
 status.textContent = '';
 const entries = Object.values(lines).filter(line => line.who === Number(role.value));
 const list = byId('voice-lines');
 list.replaceChildren();
 for (const {id, text} of entries) {
  const item = document.createElement('li');
  const code = document.createElement('strong');
  code.textContent = id;
  const dialogue = document.createElement('p');
  dialogue.textContent = text;
  const play = document.createElement('button');
  play.textContent = '再生';
  play.onclick = async () => {
   const token = ++playbackToken;
   player.hidden = false;
   status.textContent = id + ' を読み込み中…';
   const isCurrent = () => token === playbackToken;
   try {
    await window.playRecordedVoice(player, id, isCurrent);
    if (isCurrent()) status.textContent = id;
   } catch {
    if (isCurrent()) {
     player.hidden = true;
     status.textContent = id + ' の音声を再生できません。ファイル名・配置を確認してください。';
    }
   }
  };
  item.append(code, dialogue, play);
  list.append(item);
 }
 byId('voice-count').textContent = `全 ${entries.length} 本`;
}

gate.onsubmit = event => {
 event.preventDefault();
 if (byId('voice-password').value !== '1201') {
  byId('gate-status').textContent = 'パスが違います。';
  return;
 }
 for (const index of [7, 0, 1, 2, 3, 4, 5, 6, 8]) {
  const {name, actor} = stats[index];
  role.add(new Option(`${name} ／ ${actor}`, index));
 }
 gate.reset();
 gate.hidden = true;
 byId('voice-content').hidden = false;
 renderRole();
 role.focus();
};
role.onchange = renderRole;
