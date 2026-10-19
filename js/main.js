// SEVASTOLINK portfolio: boot roda a CADA visita (nenhum localStorage/sessionStorage é usado)
const $=s=>document.querySelector(s), crt=$('#crt'), view=$('#view'), menu=$('#menu');
const ITEMS=[['perfil','PERFIL'],['dfir','METODOLOGIA DFIR'],['casos','CASOS / PROJETOS'],['exp','HISTÓRICO'],['audio','AUDIO_REC'],['contato','CONTATO'],['sys','UTILITIES']];
let ac,out,muted=false,sel=0,booted=false,skip=false,hum;
const wait=ms=>new Promise(r=>setTimeout(r,skip?0:ms));

// ---- ÁUDIO (sintetizado; os sons originais do jogo são protegidos por direitos autorais) ----
function audioInit(){ if(ac)return; ac=new (window.AudioContext||window.webkitAudioContext)(); out=ac.createGain(); out.gain.value=.5; out.connect(ac.destination); }
function tone(f,d,type='square',v=.05,t0=0,f2){ if(!ac||muted)return; const o=ac.createOscillator(),g=ac.createGain(),t=ac.currentTime+t0; o.type=type;o.frequency.setValueAtTime(f,t); if(f2)o.frequency.exponentialRampToValueAtTime(f2,t+d); g.gain.setValueAtTime(v,t); g.gain.exponentialRampToValueAtTime(.0001,t+d); o.connect(g);g.connect(out);o.start(t);o.stop(t+d); }
function noise(d,v=.15,hp=1500){ if(!ac||muted)return; const n=ac.sampleRate*d,b=ac.createBuffer(1,n,ac.sampleRate),a=b.getChannelData(0); for(let i=0;i<n;i++)a[i]=(Math.random()*2-1)*(1-i/n); const s=ac.createBufferSource(),f=ac.createBiquadFilter(),g=ac.createGain(); f.type='highpass';f.frequency.value=hp;g.gain.value=v;s.buffer=b;s.connect(f);f.connect(g);g.connect(out);s.start(); }
const sPower=()=>{noise(.5,.3,300);tone(60,.6,'sine',.25);tone(15600,2.2,'sine',.012,.1);tone(7800,1.5,'sine',.01,.1)};
const sKey=()=>tone(1500+Math.random()*300,.03,'square',.03);
const sSel=()=>{tone(900,.05,'square',.04);};
const sOk=()=>{tone(500,.07,'square',.05);tone(1000,.09,'square',.05,.07)};
const sErr=()=>tone(180,.25,'sawtooth',.06);
function humStart(){ if(!ac||hum||muted)return; const o=ac.createOscillator(),g=ac.createGain(); o.type='sawtooth';o.frequency.value=50;g.gain.value=.012;o.connect(g);g.connect(out);o.start();hum={o,g}; }
function humStop(){ if(hum){hum.o.stop();hum=null} }

// ---- BOOT ----
async function boot(){
  audioInit(); if(ac.state==='suspended')ac.resume();
  $('#power').classList.add('gone'); skip=false;
  addEventListener('keydown',e=>{if(e.key==='Escape')skip=true},{once:true});
  crt.className='on'; $('#flash').classList.add('go'); sPower(); await wait(700);
  const lg=$('#logo-screen'); lg.classList.remove('hide'); await wait(250); lg.classList.add('draw'); noise(1.4,.04,3000); await wait(2400);
  lg.classList.add('hide'); crt.classList.add('sync'); noise(.5,.2,800); tone(120,.4,'sawtooth',.05,0,40); await wait(550); crt.classList.remove('sync');
  const sc=$('#scan'); sc.classList.remove('hide');
  const L=['SEEGSON SEVASTOLINK v1.0.7 PERSONAL TERMINAL','CHECANDO MEMÓRIA ........ OK','MONTANDO VOLUME LOCAL ...','> DIR /LOCAL','  LOG_01      PERFIL','  SYS_DIAG    METODOLOGIA DFIR','  CASE_FILES  CASOS / PROJETOS','  LOG_02      HISTÓRICO','  AUDIO_REC   REGISTRO DE VOZ','  COMMS       CONTATO','> VERIFICANDO ÍNDICE ...... OK','USUÁRIO: DANIEL WIDAL // NÍVEL: CANDIDATO','CARREGANDO MENU PRINCIPAL ...'];
  for(const l of L){ sc.textContent+=l+'\n'; tone(1200+Math.random()*400,.02,'square',.03); await wait(skip?0:90+Math.random()*110); }
  await wait(500); sc.classList.add('hide'); sc.textContent='';
  $('#ui').classList.remove('hide'); humStart(); build(); open(0,true); booted=true; setInterval(glitch,6500);
}

// ---- MENU / CONTEÚDO ----
function build(){ menu.innerHTML=''; ITEMS.forEach(([k,t],i)=>{const b=document.createElement('button');b.textContent=`${i+1}. ${t}`;b.onclick=()=>open(i);b.onmouseenter=()=>{if(sel!==i){mark(i);sSel()}};menu.append(b)}); }
function mark(i){ sel=i; [...menu.children].forEach((b,j)=>b.classList.toggle('sel',j===i)); }
function open(i,quiet){ mark(i); const k=ITEMS[i][0]; view.innerHTML=''; view.append($('#t-'+k).content.cloneNode(true)); view.classList.remove('ghost'); void view.offsetWidth; view.classList.add('ghost'); view.scrollTop=0; if(!quiet)sOk(); if(k==='audio')audioUI(); if(k==='sys')sysUI(); }
function sysUI(){ view.querySelectorAll('[data-fx]').forEach(b=>b.onclick=()=>{const f=b.dataset.fx; if(f==='curve')crt.classList.toggle('flat'); if(f==='scan')crt.classList.toggle('noscan'); if(f==='calm')crt.classList.toggle('calm'); sOk()}); }

// ---- VU / ÁUDIO_REC ----
function audioUI(){ const cv=$('#vu'),c=cv.getContext('2d'),pg=$('#prog'),btn=$('#play'); let t0=0,run=false,id;
  const draw=()=>{ const p=Math.min((performance.now()-t0)/6000,1); c.clearRect(0,0,520,90); c.fillStyle='#ffb23e'; for(let x=0;x<520;x+=8){ const h=run?6+Math.abs(Math.sin(x*.07+performance.now()/90))*Math.random()*70:4; c.fillRect(x,45-h/2,5,h);} const n=Math.round(p*20); pg.textContent='['+'█'.repeat(n)+'░'.repeat(20-n)+'] '+Math.round(p*100)+'%'; if(p<1&&run)id=requestAnimationFrame(draw); else {run=false;btn.textContent='[ REPRODUZIR ]'} };
  btn.onclick=()=>{ if(run){run=false;return} run=true;t0=performance.now();btn.textContent='[ PARAR ]';sOk();for(let i=0;i<24;i++)tone(180+Math.random()*260,.12,'sawtooth',.03,i*.25);draw(); }; }

// ---- EFEITOS ----
function glitch(){ if(crt.classList.contains('calm'))return; const b=$('#bar'); b.classList.remove('go'); void b.offsetWidth; b.classList.add('go'); noise(.12,.05,2500); }

// ---- ENTRADA ----
addEventListener('keydown',e=>{
  if(!booted)return; sKey();
  if(e.key==='ArrowDown'){e.preventDefault();mark((sel+1)%ITEMS.length);sSel()}
  else if(e.key==='ArrowUp'){e.preventDefault();mark((sel+ITEMS.length-1)%ITEMS.length);sSel()}
  else if(e.key==='Enter'&&document.activeElement.tagName!=='BUTTON'&&document.activeElement.tagName!=='A')open(sel);
  else if(/^[1-7]$/.test(e.key))open(+e.key-1);
  else if(e.key==='Escape'){view.blur();menu.children[sel].focus()}
});
$('#mute').onclick=e=>{muted=!muted;e.target.textContent=`[SOM: ${muted?'DESLIGADO':'LIGADO'}]`;muted?humStop():humStart()};
setInterval(()=>{const d=new Date();$('#clock').textContent='SEEGSON NET // '+d.toLocaleTimeString('pt-BR')},1000);
const pw=$('#power'); pw.onclick=boot; pw.onkeydown=e=>{if(e.key==='Enter'||e.key===' ')boot()}; addEventListener('keydown',e=>{if(!booted&&!pw.classList.contains('gone')&&e.key!=='Tab')boot()},{once:true}); pw.focus();
