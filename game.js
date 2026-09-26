'use strict';
const C=document.querySelector('#game'),g=C.getContext('2d'),screen=document.querySelector('#screen');
const W=1280,H=720,world=4400,keys={},pressed={},imgs={};
const roster=[
 {name:'IGNIS',role:'Equilibrato',color:'#ff6255',power:1,speed:265},
 {name:'AZUR',role:'Tecnico',color:'#639dff',power:.95,speed:280},
 {name:'LYRA',role:'Veloce',color:'#f5d34f',power:.9,speed:310},
 {name:'AURA',role:'Energia',color:'#ff7bbc',power:.95,speed:285},
 {name:'ONYX',role:'Potente',color:'#b7c7d7',power:1.25,speed:235}
];
const zones=[{x:760,name:'IL LUNGOMARE',n:4},{x:1710,name:'LA STRADA DEL PORTO',n:6},{x:2740,name:'IL CANCELLO',n:7},{x:3730,name:'MASTICE',n:1}];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const deepCopy=o=>JSON.parse(JSON.stringify(o));
const assetFiles={fighters:'fighters',mastice:'mastice',port:'port',story:'story','campaign-villains':'campaign-villains',objects:'objects',civilians:'civilians'};
const stagePropBlueprints=[
 {x:450,y:620,type:'crate',hp:2,drop:'health'},
 {x:710,y:618,type:'barrel',hp:2,drop:'energy'},
 {x:980,y:620,type:'barrier',hp:3,drop:null},
 {x:1130,y:612,type:'crate',hp:2,drop:'health'},
 {x:1400,y:620,type:'barrel',hp:2,drop:'energy'},
 {x:1670,y:612,type:'crate',hp:2,drop:'health'},
 {x:1975,y:622,type:'barrier',hp:3,drop:null},
 {x:2100,y:620,type:'crate',hp:2,drop:'energy'},
 {x:2480,y:620,type:'barrel',hp:2,drop:'health'},
 {x:2840,y:618,type:'crate',hp:2,drop:'energy'},
 {x:3180,y:620,type:'barrier',hp:3,drop:null},
 {x:3420,y:614,type:'crate',hp:2,drop:'health'}
];

let mode='loading',gameType='solo',chosen=0,remoteChosen=1,players=[],player=null,enemies=[],props=[],fx=[],drops=[];
let camera=0,time=0,zone=0,score=0,kills=0,combo=0,comboTimer=0,shake=0,flash=0,elapsed=0,checkpoint=0,muted=false,audio,beat=0,introPage=0,introClock=0,selectClock=0,selectCoop=false;
let padsPrev=[[],[]],netTick=0,guestSnapshot=null;
let peer=null,conn=null,isHost=false,roomCode='',netStatus='offline',remoteReady=false,localReady=false;
let remoteInput=blankInput(),remotePressed=blankPressed(),lastRemoteSeq=0,inputSeq=0;

function blankInput(){return{l:false,r:false,u:false,d:false}}
function blankPressed(){return{punch:false,kick:false,jump:false,special:false,dodge:false,pause:false}}
function sound(f=160,d=.08,type='square',vol=.035){if(muted||!audio)return;const o=audio.createOscillator(),a=audio.createGain();o.type=type;o.frequency.setValueAtTime(f,audio.currentTime);o.frequency.exponentialRampToValueAtTime(Math.max(25,f*.45),audio.currentTime+d);a.gain.setValueAtTime(vol,audio.currentTime);a.gain.exponentialRampToValueAtTime(.001,audio.currentTime+d);o.connect(a);a.connect(audio.destination);o.start();o.stop(audio.currentTime+d)}
function unlock(){if(!audio)try{audio=new(window.AudioContext||window.webkitAudioContext)()}catch(e){}audio?.resume()}
function ui(html,cls=''){screen.className=cls;screen.innerHTML=html;screen.querySelector('button')?.focus()}
function foot(){return '<div class="footer">SVILUPPATO ED IDEATO DA b3pZ · V0.4 SELECT/REFINE · PORTO AURORA</div>'}
function setNet(s){netStatus=s;const el=document.querySelector('#net-status');if(el)el.textContent=s}

function menu(){
 mode='menu';disconnectPeer(false);
 ui('<div class="eyebrow">UN ARCADE TOKUSATSU ORIGINALE</div><h1>PRIMAL<br><span>SENTINELS</span></h1><p>Una città sotto assedio. Cinque Cuori risvegliati.<br>La prima notte di una guerra dimenticata.</p><nav><button class="primary" id="solo">STORIA · 1 GIOCATORE</button><button id="coop">CO-OP ONLINE · 2 GIOCATORI</button><button id="help">COMANDI</button></nav><p class="small">PC/Mac · Tastiera e controller · Capitolo 01 / 08<br>Co-op online sperimentale via WebRTC. Ogni giocatore usa il proprio PC.</p>'+foot());
 document.querySelector('#solo').onclick=()=>{gameType='solo';unlock();introPage=0;intro()};
 document.querySelector('#coop').onclick=coopMenu;
 document.querySelector('#help').onclick=help;
}
function help(){
 mode='help';ui('<span class="eyebrow">ADDESTRAMENTO</span><h2>Entra. Colpisci. Spostati.</h2><p class="help"><kbd>WASD</kbd> / <kbd>↑↓←→</kbd> Muoviti · <kbd>J</kbd> Pugno e combo<br><kbd>K</kbd> Calcio · <kbd>Spazio</kbd> Salto / calcio aereo<br><kbd>L</kbd> Speciale (40 energia) · <kbd>Shift</kbd> Schivata<br><kbd>Esc</kbd> Pausa · <kbd>M</kbd> Audio<br><br>Controller: stick / croce direzionale · X pugno · Y calcio · A salto · B speciale · RB schivata · Start pausa.<br><br><b>CO-OP ONLINE:</b> uno crea la stanza e condivide il codice. L’altro lo inserisce. Ogni giocatore usa gli stessi comandi sul proprio computer. L’host gestisce combattimento e nemici. Se un Sentinel cade, il compagno può rianimarlo restando vicino.</p><nav><button id="back">TORNA AL MENU</button></nav>');
 document.querySelector('#back').onclick=menu;
}
const story=[['PORTO AURORA · ORE 23:47','La notte delle sirene','La frattura apparve sopra il mare. Poi gli uomini senza volto uscirono dagli specchi. Nessuno sapeva cosa cercassero.'],['OLTRE IL VELO','Una voce dimenticata','«Riportatemi i Cuori.» Vespera pronunciò cinque nomi. Sotto la città, macchine addormentate da millenni risposero.'],['IL RISVEGLIO','Non siete soli','Cinque armature si accesero. Il porto era già in fiamme. Prima di scoprire chi li avesse scelti, i nuovi Sentinels dovevano salvare la loro città.']];
function intro(){mode='intro';introClock=0;let s=story[introPage];ui(`<span class="eyebrow">${s[0]}</span><h2>${s[1]}</h2><p>${s[2]}</p><nav><button class="primary" id="next">${introPage===2?'SCEGLI IL SENTINEL':'CONTINUA'}</button><button id="skip">SALTA INTRO</button></nav><p class="small">Intro illustrata animata: civili in fuga, Vespera e i cinque Cuori.</p>`);document.querySelector('#next').onclick=()=>{introPage++;introPage>2?selection(false):intro()};document.querySelector('#skip').onclick=()=>selection(false)}
function selection(coop=false){
 mode='select'; selectClock=0; selectCoop=coop;
 ui('<div class="select-shell"><span class="eyebrow">CENTRALE DEI CUORI</span><h2>Seleziona il Sentinel</h2><p class="select-copy">Scorri il team, guarda la posa del Ranger selezionato e conferma chi entra in battaglia.</p><div class="select-nav"><button id="left" class="arrow">◀</button><div class="select-panel"><div class="select-name">'+roster[chosen].name+'</div><div class="select-role">'+roster[chosen].role+'</div><div class="select-tip">'+(coop?'Modalità CO-OP: il tuo compagno può scegliere un altro Sentinel.':'Ogni Sentinel ha stile e statistiche diverse.')+'</div></div><button id="right" class="arrow">▶</button></div><nav><button class="primary" id="go">'+(coop?'CONFERMA E TORNA ALLA LOBBY':'ENTRA A PORTO AURORA')+'</button><button id="back">INDIETRO</button></nav><p class="small">Tasti utili: ← → per scorrere · Invio per confermare</p></div>','select-screen');
 const refresh=()=>selection(coop);
 document.querySelector('#left').onclick=()=>{chosen=(chosen+roster.length-1)%roster.length;refresh()};
 document.querySelector('#right').onclick=()=>{chosen=(chosen+1)%roster.length;refresh()};
 document.querySelector('#go').onclick=()=>{unlock();if(coop){sendNet({t:'hero',hero:chosen});lobby()}else start()};
 document.querySelector('#back').onclick=()=>coop?lobby():menu();
}

function coopMenu(){
 gameType='coop';mode='coop-menu';
 ui('<span class="eyebrow">CO-OP ONLINE</span><h2>Combattete insieme.</h2><p>Crea una stanza e manda il codice al tuo amico, oppure inserisci il codice che hai ricevuto. È necessaria una connessione Internet.</p><div class="coop-grid"><button class="primary" id="host">CREA STANZA</button><div class="join-row"><input id="room" maxlength="12" autocomplete="off" placeholder="CODICE STANZA"><button id="join">ENTRA</button></div></div><p class="small">Connessione diretta WebRTC. Il giocatore che crea la stanza è l’host della simulazione.</p><nav><button id="back">MENU</button></nav>'+foot());
 document.querySelector('#host').onclick=createRoom;document.querySelector('#join').onclick=()=>joinRoom(document.querySelector('#room').value);document.querySelector('#back').onclick=menu;
}
function randomCode(){const a='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';let s='';for(let i=0;i<6;i++)s+=a[Math.floor(Math.random()*a.length)];return s}
function peerId(code){return'primal-sentinels-'+code.toLowerCase()}
function initPeer(id){return new Promise((resolve,reject)=>{if(typeof Peer==='undefined'){reject(new Error('PeerJS non caricato'));return}try{peer=new Peer(id,{debug:0});peer.on('open',()=>resolve(peer));peer.on('error',reject);peer.on('disconnected',()=>setNet('connessione signaling interrotta'));}catch(e){reject(e)}})}
async function createRoom(){
 disconnectPeer(false);isHost=true;roomCode=randomCode();netStatus='creazione stanza…';connectingScreen();
 try{await initPeer(peerId(roomCode));setNet('stanza pronta · in attesa del giocatore 2');peer.on('connection',c=>{if(conn?.open){c.close();return}attachConnection(c,true)});lobby()}catch(e){networkError(e)}
}
async function joinRoom(code){
 code=(code||'').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,12);if(!code){return}
 disconnectPeer(false);isHost=false;roomCode=code;netStatus='connessione alla stanza…';connectingScreen();
 try{await initPeer();attachConnection(peer.connect(peerId(roomCode),{reliable:true}),false)}catch(e){networkError(e)}
}
function connectingScreen(){mode='coop-connect';ui(`<span class="eyebrow">CO-OP ONLINE</span><h2>${isHost?'Creazione stanza':'Connessione'}</h2><p id="net-status">${netStatus}</p><nav><button id="cancel">ANNULLA</button></nav>`,'center');document.querySelector('#cancel').onclick=coopMenu}
function attachConnection(c,hostSide){
 conn=c;setNet('connessione WebRTC…');
 c.on('open',()=>{setNet('compagno collegato');if(hostSide)sendNet({t:'hello',hero:chosen});else sendNet({t:'hello',hero:chosen});lobby()});
 c.on('data',onNetData);c.on('close',()=>{remoteReady=false;if(mode==='play'&&gameType==='coop'){end(false,'Il compagno si è disconnesso.')}else lobby()});c.on('error',networkError);
}
function onNetData(m){
 if(!m||typeof m!=='object')return;
 if(m.t==='hello'||m.t==='hero'){remoteChosen=clamp(Number(m.hero)||0,0,4);if(mode==='coop-lobby')lobby();}
 if(m.t==='ready'){remoteReady=!!m.ready;if(mode==='coop-lobby')lobby();if(isHost)tryLaunchCoop();}
 if(m.t==='start'&&!isHost){chosen=clamp(Number(m.guestHero)||chosen,0,4);remoteChosen=clamp(Number(m.hostHero)||remoteChosen,0,4);startCoopGuest()}
 if(m.t==='input'&&isHost&&m.seq>lastRemoteSeq){lastRemoteSeq=m.seq;remoteInput=m.input||blankInput();remotePressed=m.pressed||blankPressed()}
 if(m.t==='snapshot'&&!isHost){guestSnapshot=m.state;applySnapshot(m.state)}
 if(m.t==='end'&&!isHost){applySnapshot(m.state);end(!!m.win,m.reason||'')}
 if(m.t==='pause'){if(m.paused&&mode==='play')showRemotePause();else if(!m.paused&&mode==='pause')resume(false)}
 if(m.t==='leave'){remoteReady=false;if(mode==='play')end(false,'Il compagno ha lasciato la partita.');else lobby()}
}
function sendNet(m){if(conn?.open)try{conn.send(m)}catch(e){}}
function disconnectPeer(notify=true){if(notify)sendNet({t:'leave'});try{conn?.close()}catch(e){}try{peer?.destroy()}catch(e){}conn=null;peer=null;isHost=false;roomCode='';remoteReady=false;localReady=false;guestSnapshot=null;remoteInput=blankInput();remotePressed=blankPressed()}
function networkError(e){console.error(e);mode='net-error';ui('<span class="eyebrow">CO-OP ONLINE</span><h2>Connessione non riuscita.</h2><p>Controlla Internet, il codice stanza e riprova. Alcune reti aziendali/VPN possono bloccare WebRTC.</p><p class="small">'+String(e?.type||e?.message||'errore di rete')+'</p><nav><button class="primary" id="retry">TORNA AL CO-OP</button><button id="back">MENU</button></nav>','center');document.querySelector('#retry').onclick=coopMenu;document.querySelector('#back').onclick=menu}
function lobby(){
 mode='coop-lobby';
 const connected=!!conn?.open;
 ui(`<span class="eyebrow">CO-OP ONLINE · ${isHost?'HOST':'OSPITE'}</span><h2>Lobby · ${roomCode||'—'}</h2><p>${isHost?'Condividi questo codice con il giocatore 2.':'Sei entrato nella stanza.'}</p><div class="room-code">${roomCode||'------'}</div><div class="lobby-players"><div><b>GIOCATORE ${isHost?'1':'2'} · TU</b><span>${roster[chosen].name}</span></div><div><b>GIOCATORE ${isHost?'2':'1'} · COMPAGNO</b><span>${connected?roster[remoteChosen].name:'IN ATTESA…'}</span></div></div><p class="status-dot">${connected?'● CONNESSO':'○ IN ATTESA DEL COLLEGAMENTO'}</p><nav><button id="hero">CAMBIA EROE</button><button class="primary" id="ready" ${connected?'':'disabled'}>${localReady?'ANNULLA PRONTO':'PRONTO'}</button><button id="back">ESCI</button></nav><p class="small">${isHost?'La partita parte quando entrambi siete pronti.':'Attendi che l’host avvii la partita quando entrambi siete pronti.'}</p>`);
 document.querySelector('#hero').onclick=()=>selection(true);
 document.querySelector('#ready').onclick=()=>{localReady=!localReady;sendNet({t:'ready',ready:localReady});lobby();if(isHost)tryLaunchCoop()};
 document.querySelector('#back').onclick=()=>{disconnectPeer(true);coopMenu()};
}
function tryLaunchCoop(){if(isHost&&conn?.open&&localReady&&remoteReady){sendNet({t:'start',hostHero:chosen,guestHero:remoteChosen});start(0,true)}}

function makePlayer(slot,hero){return{slot,hero,x:170+(slot?70:0),y:560+(slot?70:0),hp:130,max:130,energy:60,face:1,z:0,vz:0,cool:0,attack:0,kind:'',hit:false,inv:0,dodge:0,walk:0,stun:0,moving:false,down:false,downTimer:0,revive:0}}
function start(cp=0,coopHost=false){
 const coop=coopHost||gameType==='coop';
 players=[makePlayer(0,chosen)];if(coop)players.push(makePlayer(1,remoteChosen));player=players[0];
 enemies=[];fx=[];drops=[];zone=cp;checkpoint=cp;score=0;kills=0;combo=0;elapsed=0;camera=0;
 const base=cp?zones[cp-1].x+260:170;players.forEach((p,i)=>{p.x=base+i*70;p.y=555+i*65});
 props=stagePropBlueprints.filter(o=>o.x>base).map(o=>({...o}));
 mode='play';screen.className='hidden';spawnZone();banner(zones[zone].name);Object.keys(keys).forEach(k=>keys[k]=false);localReady=remoteReady=false;guestSnapshot=null;remoteInput=blankInput();remotePressed=blankPressed();
}
function startCoopGuest(){gameType='coop';players=[makePlayer(0,remoteChosen),makePlayer(1,chosen)];player=players[1];enemies=[];props=[];fx=[];drops=[];zone=0;score=0;kills=0;combo=0;elapsed=0;camera=0;mode='play';screen.className='hidden';Object.keys(keys).forEach(k=>keys[k]=false)}
function spawnZone(){let a=zones[zone];for(let i=0;i<a.n;i++){let boss=zone===3;enemies.push({x:a.x+180+i%3*120,y:495+(i%4)*47,hp:boss?560:zone===2?76:60,max:boss?560:zone===2?76:60,boss,face:-1,walk:0,cool:1+i*.35,wind:0,attack:0,stun:0,inv:0,dead:0,target:null,targetSlot:0,slam:false,moving:false})}}
function banner(t){fx.push({type:'banner',text:t,life:2.8,max:2.8})}
function pause(send=true){if(mode==='play'){mode='pause';if(send&&gameType==='coop')sendNet({t:'pause',paused:true});ui('<span class="eyebrow">PAUSA</span><h2>Il porto può aspettare.</h2><nav><button class="primary" id="resume">RIPRENDI</button>'+(isHost||gameType==='solo'?'<button id="retry">RIPARTI DAL CHECKPOINT</button>':'')+'<button id="back">MENU</button></nav>','center');document.querySelector('#resume').onclick=()=>resume(send);if(document.querySelector('#retry'))document.querySelector('#retry').onclick=()=>{if(gameType==='coop'&&!isHost)return;start(checkpoint,gameType==='coop')};document.querySelector('#back').onclick=()=>{disconnectPeer(true);menu()}}else if(mode==='pause')resume(send)}
function showRemotePause(){mode='pause';ui('<span class="eyebrow">PAUSA CO-OP</span><h2>Il compagno ha messo in pausa.</h2><p>La partita riprenderà insieme.</p>','center')}
function resume(send=true){mode='play';screen.className='hidden';pressed.Escape=false;if(send&&gameType==='coop')sendNet({t:'pause',paused:false})}
function end(win,reason=''){
 if(gameType==='coop'&&isHost&&conn?.open)sendNet({t:'end',win:!!win,reason,state:makeSnapshot()});
 mode=win?'win':'lose';if(win)try{localStorage.setItem('primal-level1','complete')}catch(e){}
 ui(`<span class="eyebrow">${win?'CAPITOLO 01 COMPLETATO':'IL CUORE È ANCORA ACCESO'}</span><h2>${win?'Il porto è salvo. Per ora.':'Rialzatevi, Sentinels.'}</h2><p>${reason|| (win?'Tra i resti di Mastice trovate un simbolo inciso anche nelle vostre armature. La scienziata rapita è su un convoglio diretto oltre il Velo.<br><br>PROSSIMO CAPITOLO · IL CONVOGLIO DEI PRIGIONIERI':'Mastice cerca qualcosa sotto il porto. Tornate al checkpoint e cambiate tattica.')}</p><p>PUNTEGGIO ${score} · NEMICI ${kills} · TEMPO ${Math.floor(elapsed/60)}:${String(Math.floor(elapsed%60)).padStart(2,'0')}</p><nav><button class="primary" id="again">${win?'GIOCA ANCORA':'RIPROVA DAL CHECKPOINT'}</button><button id="back">MENU</button></nav>`,'center');
 document.querySelector('#again').onclick=()=>{if(gameType==='coop'){disconnectPeer(true);coopMenu()}else start(win?0:checkpoint)};document.querySelector('#back').onclick=menu;
}
function burst(x,y,color,n=12){for(let i=0;i<n;i++)fx.push({type:'spark',x,y,vx:(Math.random()-.5)*400,vy:(Math.random()-.6)*300,life:.3+Math.random()*.2,color})}
function attack(p,kind){if(p.down||p.cool>0||p.stun>0||p.dodge>0)return;if(kind==='special'&&p.energy<40){sound(80);return}p.kind=kind;p.attack=kind==='special'?.6:.32;p.cool=kind==='special'?.8:kind==='kick'?.48:.32;p.hit=false;if(kind==='special'){p.energy-=40;p.inv=.6;flash=.15;sound(550,.35,'sawtooth')}else sound(kind==='kick'?160:220)}
function damage(attacker,e,amount){if(e.hp<=0||e.inv>0)return;e.hp-=amount;e.stun=e.boss?.13:.35;e.inv=.12;e.x+=attacker.face*(e.boss?8:25);burst(e.x,e.y-75,e.boss?'#ffbe52':'#a684ff');shake=e.boss?7:3;combo++;comboTimer=2;score+=Math.round(amount*5);attacker.energy=Math.min(100,attacker.energy+5);sound(85,.1,'sawtooth');if(e.hp<=0){e.dead=.65;kills++;score+=e.boss?2000:200;if(kills%3===0)drops.push({x:e.x,y:e.y,type:'energy',life:20})}}
function hurt(p,amount){if(!p||p.inv>0||p.down)return;p.hp-=amount;p.inv=.85;p.stun=.2;combo=0;shake=8;burst(p.x,p.y-75,'#ff685d');sound(60,.15,'sawtooth');if(p.hp<=0){p.hp=0;if(gameType==='coop'){p.down=true;p.downTimer=12;p.attack=0;p.stun=0;banner(roster[p.hero].name+' È A TERRA')}else end(false)}}
function nearestLiving(e){let live=players.filter(p=>!p.down&&p.hp>0);if(!live.length)return null;return live.reduce((a,b)=>Math.hypot(a.x-e.x,(a.y-e.y)*1.4)<=Math.hypot(b.x-e.x,(b.y-e.y)*1.4)?a:b)}
function playerInputLocal(){return{l:!!(keys.KeyA||keys.ArrowLeft||keys.padL),r:!!(keys.KeyD||keys.ArrowRight||keys.padR),u:!!(keys.KeyW||keys.ArrowUp||keys.padU),d:!!(keys.KeyS||keys.ArrowDown||keys.padD)}}
function playerPressedLocal(){return{punch:!!pressed.KeyJ,kick:!!pressed.KeyK,jump:!!pressed.Space,special:!!pressed.KeyL,dodge:!!pressed.ShiftLeft,pause:!!pressed.Escape}}
function consumeRemotePressed(){let p=remotePressed;remotePressed=blankPressed();return p}
function pollPad(){
 let gp=navigator.getGamepads?.()[0];if(!gp){keys.padL=keys.padR=keys.padU=keys.padD=false;return}
 let b=gp.buttons.map(x=>x.pressed),prev=padsPrev[0]||[];
 if(mode!=='play'&&mode!=='pause'){if((b[0]&&!prev[0]))document.activeElement?.click();if((b[15]&&!prev[15])||(b[13]&&!prev[13])){let bs=[...screen.querySelectorAll('button')],i=bs.indexOf(document.activeElement);bs[(i+1)%bs.length]?.focus()}if((b[14]&&!prev[14])||(b[12]&&!prev[12])){let bs=[...screen.querySelectorAll('button')],i=bs.indexOf(document.activeElement);bs[(i-1+bs.length)%bs.length]?.focus()}}
 const map={0:'Space',1:'KeyL',2:'KeyJ',3:'KeyK',5:'ShiftLeft',9:'Escape'};for(let n in map)if(b[n]&&!prev[n])pressed[map[n]]=true;
 keys.padL=gp.axes[0]<-.25||b[14];keys.padR=gp.axes[0]>.25||b[15];keys.padU=gp.axes[1]<-.25||b[12];keys.padD=gp.axes[1]>.25||b[13];padsPrev[0]=b;
}
function updatePlayer(p,input,press,dt){
 let r=roster[p.hero];for(let key of ['cool','inv','stun','dodge'])p[key]=Math.max(0,p[key]-dt);
 if(p.down){p.downTimer=Math.max(0,p.downTimer-dt);p.moving=false;return}
 let dx=(input.r?1:0)-(input.l?1:0),dy=(input.d?1:0)-(input.u?1:0);
 if(press.jump&&p.z===0&&p.stun===0){p.vz=520;sound(300,.1,'triangle')}
 if(press.dodge&&p.cool===0&&p.z===0){p.dodge=.24;p.inv=.35;p.cool=.65;sound(180,.08,'triangle')}
 if(press.punch)attack(p,p.z>0?'air':'punch');if(press.kick)attack(p,'kick');if(press.special)attack(p,'special');
 if(p.stun===0){let len=Math.hypot(dx,dy)||1,s=r.speed*(p.attack>0?.35:1);p.x+=dx/len*s*dt;p.y+=dy/len*s*.65*dt;if(dx)p.face=dx;p.walk+=dt*(dx||dy?9:0);if(p.dodge)p.x+=p.face*650*dt}
 p.moving=!!(dx||dy);p.x=clamp(p.x,Math.max(50,camera+35),Math.min(world-100,zones[zone].x+620));p.y=clamp(p.y,480,668);p.z=Math.max(0,p.z+p.vz*dt);if(p.z>0)p.vz-=1300*dt;else p.vz=0;
 if(p.attack>0){p.attack-=dt;if(!p.hit&&p.attack<(p.kind==='special'?.46:.21)){p.hit=true;let special=p.kind==='special';enemies.forEach(e=>{if(e.hp>0&&Math.abs(e.y-p.y)<(special?150:46)&&Math.abs(e.x-p.x)<(special?230:p.kind==='kick'?135:105)&&(special||(e.x-p.x)*p.face>-20))damage(p,e,(special?65:p.kind==='kick'?25:18)*r.power)});props.forEach(o=>{if(o.hp>0&&Math.abs(o.x-p.x)<130&&Math.abs(o.y-p.y)<50){o.hp--;burst(o.x,o.y-20,'#c7a677');if(!o.hp){if(o.drop)drops.push({x:o.x,y:o.y,type:o.drop,life:40});if(o.type==='barrier')fx.push({type:'debris',x:o.x,y:o.y-10,life:.45,max:.45});score+=75}}});if(special){fx.push({type:'ring',x:p.x,y:p.y-60,life:.5,max:.5,color:r.color});shake=10}}}
 p.energy=Math.min(100,p.energy+dt*1.6);
}
function updateRevives(dt){
 if(players.length<2)return;
 for(let down of players.filter(p=>p.down)){
   let mate=players.find(p=>p!==down&&!p.down);
   if(!mate)continue;
   if(Math.hypot(mate.x-down.x,(mate.y-down.y)*1.3)<85){down.revive+=dt;if(down.revive>=2){down.down=false;down.hp=Math.ceil(down.max*.45);down.inv=1.8;down.downTimer=0;down.revive=0;burst(down.x,down.y-70,roster[down.hero].color,25);banner(roster[down.hero].name+' È TORNATO IN PIEDI')}}else down.revive=Math.max(0,down.revive-dt*.8);
 }
 if(players.every(p=>p.down)){end(false);return}
 let expired=players.filter(p=>p.down&&p.downTimer<=0);if(expired.length&&players.every(p=>p.down||p.hp<=0)){end(false)}
}
function updateHost(dt){
 const localI=playerInputLocal(),localP=playerPressedLocal();if(localP.pause){pause();return}
 let inputs=gameType==='coop'?[localI,remoteInput]:[localI],presses=gameType==='coop'?[localP,consumeRemotePressed()]:[localP];
 players.forEach((p,i)=>updatePlayer(p,inputs[i]||blankInput(),presses[i]||blankPressed(),dt));updateRevives(dt);
 comboTimer-=dt;if(comboTimer<=0)combo=0;
 for(let e of enemies){
   for(let key of ['cool','stun','inv','attack'])e[key]=Math.max(0,e[key]-dt);if(e.hp<=0){e.dead-=dt;continue}
   let target=nearestLiving(e);if(!target)continue;e.targetSlot=target.slot;let dx=target.x-e.x,dy=target.y-e.y;e.face=dx>=0?1:-1;
   if(e.wind>0){e.wind-=dt;if(e.wind<=0){e.attack=.32;let locked=players.find(p=>p.slot===e.targetSlot)||target;if(e.slam){let tx=e.target?.x??locked.x,ty=e.target?.y??locked.y;burst(tx,ty,'#ffb24c',30);fx.push({type:'ring',x:tx,y:ty,life:.45,max:.45,color:'#ffaa4c'});shake=12;for(let p of players)if(!p.down&&Math.hypot(p.x-tx,(p.y-ty)*1.4)<120&&p.z<35)hurt(p,30)}else if(Math.abs(locked.x-e.x)<(e.boss?165:95)&&Math.abs(locked.y-e.y)<50&&locked.z<65)hurt(locked,e.boss?23:10);e.cool=e.boss?1.15:1.3}}
   else if(!e.stun&&!e.attack){let range=e.boss?140:72;if(Math.abs(dx)>range||Math.abs(dy)>25){let sp=e.boss?100:95+zone*15;e.x+=Math.sign(dx)*(Math.abs(dx)>range?sp*dt:0);e.y+=Math.sign(dy)*(Math.abs(dy)>15?sp*.6*dt:0);e.walk+=dt*7;e.moving=true}else if(e.cool===0){e.moving=false;e.wind=e.boss?.85:.5;e.slam=e.boss&&(e.hp<e.max*.5||Math.random()<.4);e.target={x:target.x,y:target.y};e.targetSlot=target.slot;sound(e.boss?120:230,.12,'triangle')}}
 }
 for(let d of drops){d.life-=dt;for(let p of players){if(!p.down&&d.life>0&&Math.hypot(p.x-d.x,p.y-d.y)<48){if(d.type==='health')p.hp=Math.min(p.max,p.hp+35);else p.energy=Math.min(100,p.energy+20);d.life=0;sound(650,.14,'sine')}}}drops=drops.filter(d=>d.life>0);
 const lead=Math.max(...players.filter(p=>!p.down).map(p=>p.x),0);if(enemies.every(e=>e.hp<=0&&e.dead<=0)){if(zone===3){end(true)}else if(lead>zones[zone].x+380){zone++;checkpoint=zone;spawnZone();players.forEach(p=>{if(!p.down)p.hp=Math.min(p.max,p.hp+18)});banner(zones[zone].name)}}
 const live=players.filter(p=>!p.down);let cx=live.length?live.reduce((s,p)=>s+p.x,0)/live.length:players[0].x;camera=clamp(cx-420,0,world-W);
 fx.forEach(f=>{f.life-=dt;if(f.type==='spark'){f.x+=f.vx*dt;f.y+=f.vy*dt;f.vy+=700*dt}});fx=fx.filter(f=>f.life>0);shake=Math.max(0,shake-dt*30);flash=Math.max(0,flash-dt);beat+=dt;if(beat>.42){beat=0;sound([65,65,82,73][Math.floor(time/1.68)%4],.16,'triangle',.012)}
 if(gameType==='coop'){netTick+=dt;if(netTick>=.05){netTick=0;sendNet({t:'snapshot',state:makeSnapshot()})}}
}
function updateGuest(dt){
 const lp=playerPressedLocal();if(lp.pause){pause();return}
 let inp=playerInputLocal(),pr=playerPressedLocal();sendNet({t:'input',seq:++inputSeq,input:inp,pressed:pr});
 if(guestSnapshot){camera=guestSnapshot.camera??camera;time=guestSnapshot.time??time;elapsed=guestSnapshot.elapsed??elapsed}
}
function update(dt){
 pollPad();if(pressed.KeyM)muted=!muted;
 if(mode==='intro')introClock+=dt;
 if(mode==='select'){selectClock+=dt; if(pressed.ArrowLeft||pressed.KeyA){chosen=(chosen+roster.length-1)%roster.length;selection(selectCoop)} if(pressed.ArrowRight||pressed.KeyD){chosen=(chosen+1)%roster.length;selection(selectCoop)} if(pressed.Enter){document.querySelector('#go')?.click()} for(let k in pressed)delete pressed[k]; return}
 if(mode!=='play'){for(let k in pressed)delete pressed[k];return}
 elapsed+=dt;time+=dt;
 if(gameType==='coop'&&!isHost)updateGuest(dt);else updateHost(dt);
 for(let k in pressed)delete pressed[k];
}
function makeSnapshot(){return{players:deepCopy(players),enemies:deepCopy(enemies),props:deepCopy(props),fx:deepCopy(fx),drops:deepCopy(drops),camera,time,zone,score,kills,combo,comboTimer,shake,flash,elapsed,checkpoint}}
function applySnapshot(s){if(!s)return;players=s.players||players;player=players[1]||players[0];enemies=s.enemies||[];props=s.props||[];fx=s.fx||[];drops=s.drops||[];camera=s.camera||0;time=s.time||0;zone=s.zone||0;score=s.score||0;kills=s.kills||0;combo=s.combo||0;comboTimer=s.comboTimer||0;shake=s.shake||0;flash=s.flash||0;elapsed=s.elapsed||0;checkpoint=s.checkpoint||0}


function drawCardHero(ctx,row){
 const img=imgs.fighters; if(!img)return; const cols=8,rows=6,sw=img.width/cols,sh=img.height/rows;
 ctx.clearRect(0,0,181,181); ctx.imageSmoothingEnabled=false;
 ctx.drawImage(img,0,row*sh,sw,sh,2,2,177,177)
}
function sprite(row,frame,x,y,size=150,face=1,ctx=g){
 const img=imgs.fighters; const cols=8,rows=6,sw=img.width/cols,sh=img.height/rows;
 if(row===4&&frame===7)frame=4;
 ctx.save();ctx.translate(x,y);ctx.scale(face,1);ctx.imageSmoothingEnabled=false;ctx.drawImage(img,frame*sw,row*sh,sw,sh,-size/2,-size,size,size);ctx.restore()
}
function villainSprite(row,frame,x,y,size=300,face=1,ctx=g){
 const img=imgs['campaign-villains']; const cols=6,rows=7,sw=img.width/cols,sh=img.height/rows;
 frame=Math.max(0,Math.min(cols-1,frame));
 ctx.save();ctx.translate(x,y);ctx.scale(face,1);ctx.imageSmoothingEnabled=false;ctx.drawImage(img,frame*sw,row*sh,sw,sh,-size/2,-size,size,size);ctx.restore()
}
function bossSprite(frame,x,y,face,alpha=1){g.save();g.globalAlpha=alpha;g.translate(x,y);g.scale(face,1);let sw=imgs.mastice.width/4,sh=imgs.mastice.height/2;g.imageSmoothingEnabled=false;g.drawImage(imgs.mastice,frame%4*sw,Math.floor(frame/4)*sh,sw,sh,-135,-250,270,270);g.restore()}
function objectSprite(idx,x,y,size=86,alpha=1){const img=imgs.objects;if(!img)return;const sw=img.width/4,sh=img.height/2;g.save();g.globalAlpha=alpha;g.imageSmoothingEnabled=false;g.drawImage(img,idx%4*sw,Math.floor(idx/4)*sh,sw,sh,x-size/2,y-size,size,size);g.restore()}
function txt(text,x,y,size=18,color='#eef6ff',align='left'){g.fillStyle=color;g.font=`700 ${size}px system-ui`;g.textAlign=align;g.fillText(text,x,y)}
function bar(x,y,w,h,value,color){g.fillStyle='#142636';g.fillRect(x,y,w,h);g.fillStyle=color;g.fillRect(x,y,w*clamp(value,0,1),h)}
function backdrop(){
 if(mode==='intro'){renderIntroScene();return}
 if(mode==='select'){renderSelectScene();return}
 if(['play','pause','win','lose'].includes(mode)){g.drawImage(imgs.port,-camera*.65,0,world*.65+W,720);g.fillStyle='#04112030';g.fillRect(0,0,W,H)}
 else{let q=0;g.drawImage(imgs.story,0,q,887,443,0,0,W,H);g.fillStyle='#05102055';g.fillRect(0,0,W,H)}
}
function drawCivilianCrowd(){
 const img=imgs.civilians;if(!img)return;const sw=img.width/4,sh=img.height;g.save();g.globalAlpha=.92;g.imageSmoothingEnabled=false;
 for(let i=0;i<7;i++){
   const frame=i%4, px=(i*190-((introClock*80)%190))-40, py=610+(i%2)*10;
   g.drawImage(img,frame*sw,0,sw,sh,px,py,126,126)
 }
 g.restore();
}

function renderSelectScene(){
 const grd=g.createLinearGradient(0,0,0,H); grd.addColorStop(0,'#13091f'); grd.addColorStop(.52,'#22113d'); grd.addColorStop(1,'#070c17'); g.fillStyle=grd; g.fillRect(0,0,W,H);
 // command room pillars
 for(let i=0;i<6;i++){ const x=96+i*210; g.fillStyle='rgba(247,229,187,.85)'; g.fillRect(x,56,18,360); g.fillStyle='rgba(247,229,187,.18)'; g.fillRect(x-10,56,38,390); }
 g.fillStyle='#4e1f7a'; g.fillRect(250,275,780,110); g.fillStyle='#6731a3'; g.fillRect(270,255,740,28);
 g.fillStyle='#06080d'; g.fillRect(0,420,W,300);
 g.fillStyle='rgba(255,255,255,.05)'; g.beginPath(); g.ellipse(640,545,410,78,0,0,7); g.fill();
 g.fillStyle='rgba(130,255,120,.22)'; g.beginPath(); g.ellipse(640,552,78,18,0,0,7); g.fill();
 // monitors
 for(let i=0;i<5;i++){ g.fillStyle='#0b0f15'; g.fillRect(315+i*115,274,70,42); g.fillStyle=i===chosen?roster[i].color:'#58d7dd'; g.fillRect(323+i*115,282,54,26); }
 g.fillStyle='rgba(137,245,255,.55)'; g.beginPath(); g.arc(642,120,58+Math.sin(selectClock*2)*6,0,7); g.fill();
 txt('1P',640,320,32,'#ffe348','center');
 g.fillStyle='#ffffff'; g.beginPath(); g.moveTo(640,330); g.lineTo(614,360); g.lineTo(666,360); g.fill();
 const atk=Math.sin(selectClock*3.2)>0.35?4:0;
 const others=[0,1,2,3,4].filter(i=>i!==chosen);
 const left=others.filter(i=>i<chosen), right=others.filter(i=>i>chosen);
 left.forEach((i,idx)=>{g.globalAlpha=.75; const px=220+idx*165; sprite(i,Math.floor(selectClock*3+idx)%2,px,470,128,1);});
 right.forEach((i,idx)=>{g.globalAlpha=.75; const px=885+idx*165; sprite(i,Math.floor(selectClock*3+idx)%2,px,470,128,1);});
 g.globalAlpha=1;
 // selected ranger
 g.save();
 g.translate(0,Math.sin(selectClock*2.6)*4);
 const glow=g.createRadialGradient(640,405,22,640,405,140); glow.addColorStop(0,roster[chosen].color+'BB'); glow.addColorStop(1,'rgba(0,0,0,0)'); g.fillStyle=glow; g.beginPath(); g.arc(640,405,138,0,7); g.fill();
 sprite(chosen,atk,640,575,228,1);
 g.restore();
 // floor reflection
 g.save(); g.globalAlpha=.18; g.translate(0,1110); g.scale(1,-.62); sprite(chosen,atk,640,575,228,1); g.restore(); g.globalAlpha=1;
 txt('SCEGLI IL TUO SENTINEL',640,666,28,'#ffe268','center');
}
function renderIntroScene(){
 g.save();
 if(introPage===0){
   let pan=(Math.sin(introClock*.35)+1)*.5;
   g.drawImage(imgs.story,10+40*pan,0,860,443,-60,-10,1400,740);
   const grd=g.createLinearGradient(0,450,0,720); grd.addColorStop(0,'rgba(5,10,20,0)'); grd.addColorStop(1,'rgba(8,12,18,.92)'); g.fillStyle=grd; g.fillRect(0,430,W,H-430);
   drawCivilianCrowd();
   for(let i=0;i<4;i++){g.fillStyle=`rgba(255,60,60,${0.08+0.05*Math.sin(introClock*5+i)})`; g.fillRect(90+i*250,500,22,90)}
   g.fillStyle='rgba(170,210,255,.08)'; g.beginPath(); g.arc(940,112,70+Math.sin(introClock*2)*8,0,7); g.fill();
 }
 else if(introPage===1){
   g.drawImage(imgs.story,887,0,887,443,0,0,W,H);
   g.fillStyle='rgba(8,5,16,.45)'; g.fillRect(0,0,W,H);
   for(let i=0;i<5;i++){g.strokeStyle=`rgba(194,110,255,${0.18+0.1*Math.sin(introClock*2+i)})`; g.lineWidth=7; g.beginPath(); g.arc(280+i*120,150+i*28,24+i*8,0,7); g.stroke()}
   villainSprite(5,4,948,654-Math.sin(introClock*2.3)*10,410,-1);
   g.fillStyle='rgba(170,120,255,.10)'; g.fillRect(760,180,410,410)
 }
 else {
   g.drawImage(imgs.story,0,443,887,444,0,0,W,H);
   g.fillStyle='rgba(8,16,22,.28)'; g.fillRect(0,0,W,H);
   for(let i=0;i<5;i++){
     const x=190+i*180; const glow=g.createRadialGradient(x,220,15,x,220,90); glow.addColorStop(0,roster[i].color+'AA'); glow.addColorStop(1,'rgba(0,0,0,0)'); g.fillStyle=glow; g.beginPath(); g.arc(x,220,90,0,7); g.fill();
     sprite(i,0,x,505-Math.sin(introClock*2+i)*6,150,1);
   }
 }
 g.restore();
}
function render(){
 g.clearRect(0,0,W,H);if(!imgs.port)return;backdrop();if(!players.length||!['play','pause','win','lose'].includes(mode))return;
 g.save();if(shake)g.translate((Math.random()-.5)*shake,(Math.random()-.5)*shake);g.translate(-camera,0);
 for(let e of enemies)if(e.wind>0){g.save();g.strokeStyle=e.boss?'#ffb657':'#ed687d';g.lineWidth=3;g.setLineDash([7,5]);g.beginPath();g.ellipse(e.slam?(e.target?.x||e.x):e.x,e.slam?(e.target?.y||e.y):e.y,e.boss?115:70,30,0,0,Math.PI*2);g.stroke();g.restore()}
 let objects=[...props.filter(o=>o.hp>0).map(o=>({...o,type:'prop',propType:o.type})),...enemies.filter(e=>e.hp>0||e.dead>0).map(e=>({...e,type:'enemy'})),...players.map(o=>({...o,type:'player'}))].sort((a,b)=>a.y-b.y);
 for(let o of objects){
  g.fillStyle='#02081566';g.beginPath();g.ellipse(o.x,o.y+3,o.boss?80:38,10,0,0,Math.PI*2);g.fill();
  if(o.type==='prop'){ const idx={crate:0,barrel:1,barrier:2,beacon:5}[o.propType||'crate']; objectSprite(idx,o.x,o.y+3,o.propType==='barrier'?94:84,o.hp<=0?0:1); continue }
  let isP=o.type==='player';let frame=o.down?7:o.stun>0?7:o.attack>0?(isP?(o.kind==='kick'||o.kind==='air'?6:o.attack>.21?4:5):5):o.wind>0?4:o.z>0?6:o.moving?1+Math.floor(o.walk)%3:0;
  g.save();if(!isP&&o.hp<=0)g.globalAlpha=Math.max(0,o.dead/.65);if(isP&&o.inv>0&&Math.floor(time*18)%2)g.globalAlpha=.55;if(isP&&o.down)g.globalAlpha=.72;
  if(o.boss){frame=o.hp<=0?7:o.stun?6:o.wind?3:o.attack?(o.slam?5:4):Math.floor(o.walk)%3;bossSprite(frame,o.x,o.y,o.face)}else sprite(isP?o.hero:5,frame,o.x,o.y-(o.z||0),146,o.face);g.restore();
  if(!isP&&o.hp>0&&!o.boss)bar(o.x-27,o.y-157,54,4,o.hp/o.max,'#a398e8');
  if(isP&&o.down){txt('A TERRA',o.x,o.y-170,13,'#ff776d','center');if(o.revive>0)bar(o.x-45,o.y-155,90,6,o.revive/2,'#6fdfb3')}
 }
 for(let d of drops){objectSprite(d.type==='health'?3:4,d.x,d.y-6+Math.sin(time*4)*4,58);}
 for(let f of fx){g.globalAlpha=Math.min(1,f.life*3);if(f.type==='spark'){g.fillStyle=f.color;g.fillRect(f.x,f.y,5,5)}if(f.type==='ring'){g.strokeStyle=f.color;g.lineWidth=6;g.beginPath();g.ellipse(f.x,f.y,220*(1-f.life/f.max),90*(1-f.life/f.max),0,0,7);g.stroke()}if(f.type==='debris'){objectSprite(6,f.x,f.y,64,f.life/f.max)}g.globalAlpha=1}
 if(enemies.every(e=>e.hp<=0)&&zone<3)txt('AVANTI  →',camera+W-165,380,26,'#ffe0a0');g.restore();
 renderHUD();
 if(flash){g.fillStyle='#c0eaff55';g.fillRect(0,0,W,H)}
}
function renderHUD(){
 const p1=players[0],p2=players[1];
 g.fillStyle='#071320d9';g.fillRect(24,23,p2?315:340,95);sprite(p1.hero,0,65,114,80);txt(roster[p1.hero].name,112,49,18,roster[p1.hero].color);bar(112,61,p2?200:225,15,p1.hp/p1.max,'#6fdfb3');bar(112,86,p2?200:225,7,p1.energy/100,'#69aeee');if(p1.down)txt('A TERRA',112,110,11,'#ff746b');
 if(p2){g.fillStyle='#071320d9';g.fillRect(350,23,315,95);sprite(p2.hero,0,390,114,80);txt(roster[p2.hero].name,437,49,18,roster[p2.hero].color);bar(437,61,200,15,p2.hp/p2.max,'#6fdfb3');bar(437,86,200,7,p2.energy/100,'#69aeee');if(p2.down)txt('A TERRA',437,110,11,'#ff746b')}
 txt('01 / 08   PORTO AURORA',W-30,44,16,'#e2e9ed','right');txt(String(score).padStart(7,'0'),W-30,76,27,'#f3bd75','right');if(combo>1)txt(combo+' HIT',W-30,113,22,'#fff1c6','right');
 txt(gameType==='coop'?'CO-OP ONLINE · RESTA VICINO A UN COMPAGNO A TERRA PER RIANIMARLO':'WASD  MUOVI     J  PUGNO     K  CALCIO     SPAZIO  SALTO     L  SPECIALE     SHIFT  SCHIVA     ESC  PAUSA',640,702,12,'#b8c8d7','center');
 let b=enemies.find(e=>e.boss&&e.hp>0);if(b){txt('MASTICE · IL CUSTODE DEL PORTO',640,142,15,'#ffbe75','center');bar(445,155,390,13,b.hp/b.max,'#eb9052');if(b.hp<b.max*.5)txt('ARMATURA INSTABILE',640,188,12,'#ffc67f','center')}
 let ban=fx.find(f=>f.type==='banner');if(ban){g.fillStyle='#071522bd';g.fillRect(300,220,680,70);txt(ban.text,640,266,28,'#f5dcad','center')}
}
window.addEventListener('keydown',e=>{if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();if(!keys[e.code])pressed[e.code]=true;keys[e.code]=true});
window.addEventListener('keyup',e=>keys[e.code]=false);
window.addEventListener('blur',()=>{for(let k in keys)keys[k]=false;if(mode==='play')pause()});
window.addEventListener('beforeunload',()=>disconnectPeer(true));
let last=0;function loop(t){let dt=Math.min(.033,(t-last)/1000||.016);last=t;update(dt);render();requestAnimationFrame(loop)}
Promise.all(Object.entries(assetFiles).map(([key,file])=>new Promise((resolve,reject)=>{let i=new Image();i.onload=()=>{imgs[key]=i;resolve()};i.onerror=()=>reject(file);i.src='assets/'+file+'.png'}))).then(()=>{document.querySelector('#loading').remove();menu();requestAnimationFrame(loop)}).catch(name=>{document.querySelector('#loading').textContent='File mancante: '+name+'.png. Estrai tutto lo ZIP prima di aprire index.html.'});
window.gameStatus=()=>({mode,gameType,isHost,roomCode,zone,score,kills,players:players.map(p=>({slot:p.slot,hero:p.hero,x:p.x,y:p.y,hp:p.hp,energy:p.energy,down:p.down})),enemies:enemies.filter(e=>e.hp>0).length,connected:!!conn?.open});
