const fs=require('fs'),path=require('path'),vm=require('vm');
const root=path.join(__dirname,'..'),ctx={window:{}};vm.createContext(ctx);
for(const f of ['data.js','series.js','audio-manifest.js'])vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),ctx);
const images=new Set(),add=(folder,id)=>images.add(`assets/${folder}/img-${String(id).padStart(3,'0')}.png`);
for(const n of [190,191,192,...Array.from({length:6},(_,i)=>'193-'+String(i+1).padStart(2,'0'))])add('ui',n);
for(const n of [1,5,9,13,14,15,16])add('characters',n);
for(const d of Object.values(ctx.window.ECLUNE_CASES)){
 for(const n of Object.values(d.npc||{}))add('characters',n);
 const visit=x=>{if(Array.isArray(x))return x.forEach(visit);if(!x||typeof x!=='object')return;
  if(typeof x.background==='number')add('backgrounds',x.background);
  for(const n of [...(x.images||[]),...(x.displayImages||[])])add('evidence',n);
  Object.values(x).forEach(visit);
 };visit(d);
}
for(const n of [65,66,69,70])add('backgrounds',n);
const audio=Object.values(ctx.window.ECLUNE_AUDIO.bgm).concat(Object.values(ctx.window.ECLUNE_AUDIO.se));
const manifest={images:[...images].sort(),audio,voice:'voice-manifest.js is empty; add supplied CV later'};
if(process.argv.includes('--write'))fs.writeFileSync(path.join(root,'asset-manifest.json'),JSON.stringify(manifest,null,2)+'\n');
const missing=[...images,...audio].filter(p=>!fs.existsSync(path.join(root,p)));
console.log(JSON.stringify({images:images.size,audio:audio.length,missing},null,2));
if(missing.length)process.exitCode=1;
