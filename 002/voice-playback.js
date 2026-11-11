'use strict';

window.playRecordedVoice = async (audio, id, isCurrent) => {
 const folder = id.split('-')[0];
 const base = `voices/${folder}/${id}`;
 const override = window.VOICE_MANIFEST?.[id];
 const paths = new Set([override, base + '.wav', base + '.mp3'].filter(Boolean));
 for (const path of paths) {
  if (!isCurrent()) return;
  audio.src = path;
  try {
   await audio.play();
   return;
  } catch (error) {
   if (error.name === 'AbortError' || !isCurrent()) return;
   if (error.name === 'NotAllowedError') throw error;
  }
 }
 throw new Error('音声ファイルを読み込めません。');
};
