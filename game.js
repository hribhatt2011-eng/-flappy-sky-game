(()=>{"use strict";
const c=document.getElementById('screen'),x=c.getContext('2d'),$=id=>document.getElementById(id);
let W=420,H=740,D=1,state='home',last=0,rocket,pipes=[],coins=[],dust=[],score=0,earned=0,total=+(localStorage.skyCoins||0),best=+(localStorage.skyBest||0),quality=localStorage.skyQuality||'high',soundOn=localStorage.skySound!=='false',musicOn=localStorage.skyMusic!=='false',vibe=localStorage.skyVibe!=='false',audio=null,musicTimer=null,spawn=0,ground=0;
const maps=[['Haunted Castle',0,'#190d25','#79223a','#e83d38','♜'],['Lava Fortress',100,'#210b08','#a52a12','#ff6b20','♨'],['Dark Forest',120,'#061b16','#164b35','#7ad66b','♣'],['Frozen World',140,'#071b32','#2675a0','#a8edff','❄'],['Cyber City',160,'#090b2c','#34318d','#35f4ff','▦'],['Desert Ruins',180,'#38200d','#a85b28','#ffd06a','△'],['Space Galaxy',200,'#08071e','#3a236f','#c49cff','✦'],['Doom Volcano',240,'#210508','#6e1019','#ff3028','♨']];
const pipeskins=[['Skull Metal',0,'#34313b','#ff3434','#b9b8c2'],['Lava Cracked',80,'#25100c','#ff5a18','#ffb34a'],['Frozen Ice',100,'#12334c','#7be7ff','#d9faff'],['Thorned Wood',120,'#172b18','#79a34b','#a6c47a'],['Cyber Steel',140,'#101b35','#20eaff','#7e91ff'],['Ancient Stone',160,'#33291d','#d6b16a','#b8a58a'],['Alien Crystal',180,'#21113d','#c06bff','#75ffe1'],['Demon Gold',220,'#32100e','#ffc43b','#ff6b35']];
const rockets=[['Starter Rocket',0,'#c7d2df','#7b8798'],['Deadly Rocket',250,'#25232b','#ff2525'],['Flame Rocket',90,'#a82c13','#ffb12e'],['Ice Rocket',110,'#b9efff','#168bc5'],['Thunder Rocket',130,'#3b318c','#f5e94c'],['Cyber Rocket',150,'#142b43','#26f2ff'],['Golden Rocket',180,'#ffcf42','#ff7b19'],['Shadow Rocket',220,'#17151e','#a58bff']];
let mapIndex=+(localStorage.skyMap||0),pipeIndex=+(localStorage.skyPipe||0),rocketIndex=+(localStorage.skyRocketIndex||0),tab='maps';
const img={};[['rocket','deadly-rocket.png'],['bg','deadly-background.jpg'],['cap','skull-pipe-cap.png'],['body','lava-pipe-body.png'],['coin','rupee-coin.png']].forEach(([k,s])=>{img[k]=new Image();img[k].src=s});
const bgCache=document.createElement('canvas');let cacheReady=false;
function resize(){let r=c.getBoundingClientRect();D=Math.min(devicePixelRatio||1,1.5);c.width=r.width*D;c.height=r.height*D;W=r.width;H=r.height;x.setTransform(D,0,0,D,0,0);cacheReady=false}addEventListener('resize',resize);resize();
const panels=['home','pause-panel','over','settings','garage','premium'];function panel(id){panels.forEach(v=>$(v).classList.toggle('hidden',v!==id))}function hud(v){$('hud').classList.toggle('hidden',!v)}function toast(t){$('toast').textContent=t;$('toast').classList.remove('hidden');setTimeout(()=>$('toast').classList.add('hidden'),1500)}
function beep(f=500,d=.08,type='sine'){if(!soundOn)return;try{audio=audio||new(window.AudioContext||window.webkitAudioContext)();let o=audio.createOscillator(),g=audio.createGain();o.type=type;o.frequency.value=f;g.gain.value=.03;o.connect(g);g.connect(audio.destination);o.start();g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+d);o.stop(audio.currentTime+d)}catch(e){}}
function stopMusic(){if(musicTimer)clearInterval(musicTimer);musicTimer=null}function startMusic(){stopMusic();if(!musicOn)return;let n=0;musicTimer=setInterval(()=>{if(state==='playing')beep([330,392,494,392][n++%4],.12,'triangle')},600)}
function reset(){score=0;earned=0;pipes=[];coins=[];dust=[];spawn=.6;rocket={x:W*.27,y:H*.44,vy:0,rot:0};$('score').textContent=0;$('coins').textContent=total}
function start(){reset();state='playing';panel(null);hud(true);last=performance.now();startMusic();beep(660)}function pause(){if(state!=='playing')return;state='paused';panel('pause-panel');stopMusic()}function resume(){if(state!=='paused')return;state='playing';panel(null);last=performance.now();startMusic()}
function finish(){if(state!=='playing')return;state='over';stopMusic();best=Math.max(best,score);total+=earned;localStorage.skyBest=best;localStorage.skyCoins=total;$('final-score').textContent=score;$('final-best').textContent=best;$('final-coins').textContent=earned;hud(false);panel('over');beep(130,.3,'sawtooth')}
function flap(){if(state!=='playing')return;rocket.vy=-340;beep(620,.06,'square');if(vibe&&navigator.vibrate)navigator.vibrate(12);for(let i=0;i<8;i++)dust.push({x:rocket.x-15,y:rocket.y,vx:-40-Math.random()*90,vy:(Math.random()-.5)*100,life:.4})}
const GAP=230,PW=70,ART=88;
function addPipe(){let top=100+Math.random()*(H*.48);pipes.push({x:W+25,top,passed:false});coins.push({x:W+PW/2+25,y:top+GAP/2,taken:false})}

function bg(){
 const m=maps[mapIndex], theme=mapIndex;
 const sky=x.createLinearGradient(0,0,0,H);
 sky.addColorStop(0,m[2]); sky.addColorStop(.68,m[3]); sky.addColorStop(1,'#090a12');
 x.fillStyle=sky; x.fillRect(0,0,W,H);
 const glow=m[4];
 x.globalAlpha=.82; x.fillStyle=glow; x.beginPath();
 x.arc(W*.76,H*.19,Math.min(W,H)*.09,0,Math.PI*2); x.fill(); x.globalAlpha=1;
 // Each world has its own recognizable silhouette and atmosphere.
 if(theme===0){ // Haunted Castle
   x.fillStyle='#090812';
   for(let i=0;i<6;i++){let xx=i*W/5-20,hh=H*(.24+(i%3)*.055);x.fillRect(xx,H*.68-hh,58,hh);x.fillRect(xx+18,H*.68-hh-23,22,23);x.beginPath();x.moveTo(xx+10,H*.68-hh);x.lineTo(xx+29,H*.68-hh-42);x.lineTo(xx+48,H*.68-hh);x.fill();}
   x.fillStyle='#ffb2a0';for(let i=0;i<12;i++){x.fillRect((i*61)%W,H*(.38+(i%4)*.045),3,5);}
 } else if(theme===1 || theme===7){ // Lava / Doom Volcano
   x.fillStyle='#170707';for(let i=0;i<5;i++){let xx=i*W/4-45,peak=H*(.30+(i%2)*.08);x.beginPath();x.moveTo(xx,H*.72);x.lineTo(xx+75,peak);x.lineTo(xx+155,H*.72);x.fill();}
   x.strokeStyle=theme===7?'#ff3526':'#ff7828';x.lineWidth=5;
   for(let i=0;i<4;i++){x.beginPath();x.moveTo(i*W/3,H*.69);x.quadraticCurveTo(i*W/3+35,H*.63,i*W/3+65,H*.72);x.stroke();}
   for(let i=0;i<22;i++){x.fillStyle=i%2?'#ffb13b':'#ff4b21';x.globalAlpha=.7;x.beginPath();x.arc((i*47+performance.now()*.018)%W,H*(.38+(i*13%42)/100),2+(i%3),0,7);x.fill();}x.globalAlpha=1;
 } else if(theme===2){ // Dark Forest
   for(let i=0;i<12;i++){let xx=i*W/10-20,hh=H*(.25+(i*7%25)/100);x.fillStyle=i%2?'#07150f':'#0a2118';x.fillRect(xx+18,H*.72-hh,14,hh);x.beginPath();x.moveTo(xx-20,H*.72-hh+22);x.lineTo(xx+25,H*.72-hh-55);x.lineTo(xx+70,H*.72-hh+22);x.fill();}
   x.globalAlpha=.22;x.fillStyle='#9cff9a';for(let i=0;i<5;i++)x.fillRect(0,H*(.45+i*.07),W,12);x.globalAlpha=1;
 } else if(theme===3){ // Frozen World
   x.fillStyle='#c9f5ff';x.globalAlpha=.55;for(let i=0;i<7;i++){let xx=i*W/6-50,peak=H*(.32+(i%3)*.07);x.beginPath();x.moveTo(xx,H*.72);x.lineTo(xx+75,peak);x.lineTo(xx+150,H*.72);x.fill();}x.globalAlpha=1;
   x.fillStyle='#fff';for(let i=0;i<45;i++){let xx=(i*83)%W,yy=(i*47+performance.now()*.025)%(H*.7);x.fillRect(xx,yy,2,4);}
 } else if(theme===4){ // Cyber City
   for(let i=0;i<10;i++){let xx=i*W/9-8,bh=H*(.22+(i*19%32)/100);x.fillStyle=i%2?'#11153d':'#171a4b';x.fillRect(xx,H*.72-bh,W/12,bh);x.fillStyle=i%2?'#34eaff':'#f34cff';for(let yy=H*.72-bh+12;yy<H*.70;yy+=20)x.fillRect(xx+8,yy,4,7);}
   x.strokeStyle='#38eaff';x.globalAlpha=.35;x.lineWidth=2;for(let i=0;i<4;i++){x.beginPath();x.moveTo(0,H*(.25+i*.1));x.lineTo(W,H*(.18+i*.1));x.stroke();}x.globalAlpha=1;
 } else if(theme===5){ // Desert Ruins
   x.fillStyle='#3a210f';x.beginPath();x.moveTo(0,H*.72);x.quadraticCurveTo(W*.25,H*.48,W*.5,H*.72);x.quadraticCurveTo(W*.78,H*.52,W,H*.72);x.fill();
   x.fillStyle='#6e4522';for(let i=0;i<3;i++){let xx=W*(.16+i*.3);x.beginPath();x.moveTo(xx,H*.68);x.lineTo(xx+32,H*.40);x.lineTo(xx+64,H*.68);x.fill();x.fillRect(xx+10,H*.62,44,8);}
   x.globalAlpha=.18;x.fillStyle='#ffe0a0';for(let i=0;i<5;i++)x.fillRect(0,H*(.35+i*.08),W,5);x.globalAlpha=1;
 } else { // Space Galaxy
   x.fillStyle='#d9c7ff';x.globalAlpha=.18;x.beginPath();x.ellipse(W*.48,H*.42,W*.42,H*.10,-.4,0,7);x.fill();x.globalAlpha=1;
   x.fillStyle='#fff';for(let i=0;i<70;i++){let xx=(i*67)%W,yy=(i*43)%(H*.72);x.fillRect(xx,yy,1.5,1.5);}
   x.fillStyle='#6e53a8';x.beginPath();x.arc(W*.25,H*.31,22,0,7);x.fill();x.fillStyle='#b48bff';x.beginPath();x.arc(W*.83,H*.48,11,0,7);x.fill();
 }
 // A restrained moving particle layer adds life without heavy blur.
 x.globalAlpha=.35;x.fillStyle=glow;
 for(let i=0;i<12;i++){let px=(i*83-performance.now()*.012+W*2)%(W+10);x.beginPath();x.arc(px,H*(.18+(i*31%58)/100),1.5,0,7);x.fill();}
 x.globalAlpha=1;
}


function pipe(p){
 const skin=pipeskins[pipeIndex], b=p.top+GAP, artW=ART, ax=p.x-(artW-PW)/2;
 const symbol=['☠','♨','❄','♠','✦','◆','✧','♛'][pipeIndex];
 function shaft(y,h){
  if(h<=0)return;
  let g=x.createLinearGradient(p.x,0,p.x+PW,0);
  g.addColorStop(0,'#05070b');g.addColorStop(.12,skin[2]);g.addColorStop(.32,skin[4]);g.addColorStop(.5,'#f5e6c2');g.addColorStop(.62,skin[4]);g.addColorStop(.9,skin[2]);g.addColorStop(1,'#05070b');
  x.fillStyle=g;x.fillRect(p.x,y,PW,h);
  x.fillStyle='#0009';x.fillRect(p.x+5,y,5,h);x.fillRect(p.x+PW-10,y,5,h);
  x.fillStyle='#ffffff35';x.fillRect(p.x+14,y,2,h);x.fillRect(p.x+PW-17,y,2,h);
  for(let yy=y+14;yy<y+h;yy+=58){
   let pg=x.createLinearGradient(p.x,yy,p.x,yy+29);pg.addColorStop(0,skin[2]);pg.addColorStop(.5,skin[4]);pg.addColorStop(1,skin[2]);
   x.fillStyle='#06080d';x.fillRect(p.x+9,yy,PW-18,30);x.fillStyle=pg;x.fillRect(p.x+11,yy+2,PW-22,26);
   x.strokeStyle=skin[3];x.lineWidth=2;x.strokeRect(p.x+11,yy+2,PW-22,26);
   for(let bx of [p.x+16,p.x+PW-16]){x.fillStyle='#fff1b4';x.beginPath();x.arc(bx,yy+15,2.3,0,7);x.fill();x.fillStyle='#493018';x.beginPath();x.arc(bx,yy+15,1,0,7);x.fill();}
  }
  x.fillStyle=skin[3];x.globalAlpha=.45;x.fillRect(p.x+PW-3,y,2,h);x.globalAlpha=1;
 }
 function collar(y){
  let cg=x.createLinearGradient(ax,y,ax+artW,y);cg.addColorStop(0,'#05070b');cg.addColorStop(.18,skin[2]);cg.addColorStop(.48,skin[4]);cg.addColorStop(.7,skin[2]);cg.addColorStop(1,'#05070b');
  x.fillStyle=cg;x.fillRect(ax,y,artW,29);x.strokeStyle=skin[3];x.lineWidth=3;x.strokeRect(ax+1,y+1,artW-2,27);
  x.fillStyle='#fff0b5';for(let bx=ax+10;bx<ax+artW-7;bx+=17){x.beginPath();x.arc(bx,y+14,2,0,7);x.fill();}
  x.fillStyle='#0009';x.fillRect(ax+4,y+24,artW-8,3);
  x.save();x.shadowColor=skin[3];x.shadowBlur=8;x.fillStyle=skin[3];x.font='bold 19px sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText(symbol,ax+artW/2,y+15);x.restore();
 }
 shaft(0,p.top+26);shaft(b-26,H-(b-26));
 collar(p.top-2);collar(b-27);
}


function drawRocket(){
 const r=rockets[rocketIndex], body=r[2], accent=r[3], t=performance.now()/1000;
 x.save();x.translate(rocket.x,rocket.y);x.rotate(rocket.rot);
 // Pulsing layered exhaust plume and hot core.
 let flick=.82+.18*Math.sin(t*25);
 let flame=x.createLinearGradient(-14,0,-58*flick,0);
 flame.addColorStop(0,'#fff7bd');flame.addColorStop(.28,'#ffcf42');flame.addColorStop(.68,accent);flame.addColorStop(1,'#e52c12');
 x.fillStyle=flame;x.beginPath();x.moveTo(-12,-7);x.quadraticCurveTo(-34,-15,-57*flick,0);x.quadraticCurveTo(-34,15,-12,7);x.fill();
 x.fillStyle='#fff4c2';x.beginPath();x.moveTo(-13,-3);x.quadraticCurveTo(-31,-5,-39*flick,0);x.quadraticCurveTo(-31,5,-13,3);x.fill();
 // Rear nozzle and stabilizer fins.
 let metal=x.createLinearGradient(-24,-15,-5,15);metal.addColorStop(0,'#222b37');metal.addColorStop(.5,'#c8d0d9');metal.addColorStop(1,'#303846');
 x.fillStyle=metal;x.strokeStyle='#080b11';x.lineWidth=2;
 x.beginPath();x.moveTo(-23,-8);x.lineTo(-10,-11);x.lineTo(-8,-5);x.lineTo(-8,5);x.lineTo(-10,11);x.lineTo(-23,8);x.closePath();x.fill();x.stroke();
 x.fillStyle=accent;x.beginPath();x.moveTo(-8,-7);x.lineTo(-22,-20);x.lineTo(-25,-6);x.lineTo(-15,0);x.closePath();x.fill();x.stroke();
 x.beginPath();x.moveTo(-8,7);x.lineTo(-22,20);x.lineTo(-25,6);x.lineTo(-15,0);x.closePath();x.fill();x.stroke();
 // Main fuselage with metallic 3D gradient.
 let hull=x.createLinearGradient(-17,-16,17,15);hull.addColorStop(0,'#f4f7fb');hull.addColorStop(.18,body);hull.addColorStop(.48,'#f4f6f8');hull.addColorStop(.72,body);hull.addColorStop(1,'#202633');
 x.fillStyle=hull;x.strokeStyle='#070a11';x.lineWidth=2.5;
 x.beginPath();x.moveTo(-18,-9);x.lineTo(5,-13);x.quadraticCurveTo(25,-9,29,0);x.quadraticCurveTo(25,9,5,13);x.lineTo(-18,9);x.quadraticCurveTo(-23,0,-18,-9);x.closePath();x.fill();x.stroke();
 // Nose cone and front metallic ring.
 x.fillStyle=accent;x.beginPath();x.moveTo(12,-10);x.quadraticCurveTo(29,-7,31,0);x.quadraticCurveTo(29,7,12,10);x.lineTo(17,0);x.closePath();x.fill();
 x.strokeStyle='#fff9';x.lineWidth=1.2;x.beginPath();x.moveTo(-15,-8);x.lineTo(5,-11);x.stroke();
 // Canopy / cockpit.
 let glass=x.createRadialGradient(1,-4,1,3,0,9);glass.addColorStop(0,'#d8ffff');glass.addColorStop(.35,accent);glass.addColorStop(1,'#071b32');
 x.fillStyle=glass;x.strokeStyle='#111827';x.lineWidth=2;x.beginPath();x.ellipse(5,0,8,7,0,0,Math.PI*2);x.fill();x.stroke();
 // Rivets and side panel.
 x.fillStyle='#fff1ba';for(let xx of [-12,-2,17]){x.beginPath();x.arc(xx,-8,1.4,0,7);x.fill();x.beginPath();x.arc(xx,8,1.4,0,7);x.fill();}
 x.fillStyle=accent;x.fillRect(-12,-2,9,4);
 x.restore();
}

function update(dt){if(state!=='playing')return;let speed=170+Math.min(score*3,90);rocket.vy=Math.min(430,rocket.vy+780*dt);rocket.y+=rocket.vy*dt;rocket.rot=Math.max(-.38,Math.min(.68,rocket.vy/760));spawn-=dt;if(spawn<=0){addPipe();spawn=Math.max(1.12,1.48-score*.012)}pipes.forEach(p=>{p.x-=speed*dt;if(!p.passed&&p.x+PW<rocket.x){p.passed=true;score++;$('score').textContent=score;beep(800,.05)}const hx=31,hy=18,ca=Math.abs(Math.cos(rocket.rot)),sa=Math.abs(Math.sin(rocket.rot)),hitX=hx*ca+hy*sa,hitY=hx*sa+hy*ca;if(rocket.x+hitX>p.x-9&&rocket.x-hitX<p.x+ART-9&&(rocket.y-hitY<p.top+2||rocket.y+hitY>p.top+GAP-2))finish()});pipes=pipes.filter(p=>p.x>-100);coins.forEach(q=>{q.x-=speed*dt;if(!q.taken&&Math.hypot(q.x-rocket.x,q.y-rocket.y)<24){q.taken=true;earned++;beep(1000,.08);if(vibe&&navigator.vibrate)navigator.vibrate(18)}});coins=coins.filter(q=>q.x>-30&&!q.taken);if(rocket.y-20<0||rocket.y+20>H-35)finish();ground=(ground+speed*dt)%40;dust.forEach(q=>{q.x+=q.vx*dt;q.y+=q.vy*dt;q.life-=dt});dust=dust.filter(q=>q.life>0);$('coins').textContent=total+earned}
function render(){bg();pipes.forEach(pipe);coins.forEach(q=>{x.save();x.translate(q.x,q.y);let pulse=1+.07*Math.sin(performance.now()/130+q.x);x.scale(pulse,pulse);let cg=x.createRadialGradient(-5,-6,2,0,0,16);cg.addColorStop(0,'#fff5b0');cg.addColorStop(.35,'#ffd84b');cg.addColorStop(.72,'#d58a17');cg.addColorStop(1,'#74400b');x.shadowColor='#ffcf36';x.shadowBlur=8;x.fillStyle=cg;x.beginPath();x.arc(0,0,13,0,Math.PI*2);x.fill();x.shadowBlur=0;x.strokeStyle='#fff0a0';x.lineWidth=2;x.beginPath();x.arc(0,0,10,0,Math.PI*2);x.stroke();x.strokeStyle='#8a510b';x.lineWidth=1.5;x.beginPath();x.arc(0,0,7,0,Math.PI*2);x.stroke();x.fillStyle='#8a510b';x.font='bold 11px sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText('★',0,.5);x.restore()});dust.forEach(q=>{x.globalAlpha=Math.max(0,q.life/.4);x.fillStyle='#fff2a5';x.beginPath();x.arc(q.x,q.y,2,0,7);x.fill();x.globalAlpha=1});if(rocket)drawRocket();let y=H-35;x.fillStyle='#24161b';x.fillRect(0,y,W,35);x.fillStyle=maps[mapIndex][4];x.fillRect(0,y,W,7);x.fillStyle='#75604c';for(let a=-40+ground;a<W;a+=40)x.fillRect(a,y+16,20,4)}
function loop(t){let dt=Math.min((t-last)/1000||0,.035);last=t;update(dt);render();requestAnimationFrame(loop)}
function owned(kind,i){return i===0||localStorage['own_'+kind+'_'+i]==='1'}function unlock(kind,i,cost){if(owned(kind,i)){if(kind==='maps'){mapIndex=i;localStorage.skyMap=i}else if(kind==='pipes'){pipeIndex=i;localStorage.skyPipe=i}else{rocketIndex=i;localStorage.skyRocketIndex=i}garageUI();return}if(total<cost){toast('Collect '+(cost-total)+' more coins');return}total-=cost;localStorage.skyCoins=total;localStorage['own_'+kind+'_'+i]='1';if(kind==='maps'){mapIndex=i;localStorage.skyMap=i}else if(kind==='pipes'){pipeIndex=i;localStorage.skyPipe=i}else{rocketIndex=i;localStorage.skyRocketIndex=i}garageUI();}
function garageUI(){panel('garage');let items=tab==='maps'?maps:tab==='pipes'?pipeskins:rockets,kind=tab;$('garage-title').textContent=tab==='maps'?'CHOOSE MAP':tab==='pipes'?'PIPE COLLECTION':'ROCKET GARAGE';$('garage-grid').innerHTML='';items.forEach((it,i)=>{let d=document.createElement('div');d.className='skin';let isOwned=owned(kind,i),active=(kind==='maps'?mapIndex:kind==='pipes'?pipeIndex:rocketIndex)===i;d.innerHTML=`<span class="emoji">${kind==='maps'?it[5]:kind==='pipes'?'▥':'🚀'}</span><strong>${it[0]}</strong><small>${it[1]===0?'FREE':'🪙 '+it[1]}</small>`;let b=document.createElement('button');b.textContent=active?'SELECTED':isOwned?'USE':'UNLOCK';b.onclick=()=>unlock(kind,i,it[1]);d.appendChild(b);$('garage-grid').appendChild(d)});$('wallet').textContent='🪙 '+total;$('garage').classList.remove('hidden')}
function sync(){$('quality').value=quality;$('sound').checked=soundOn;$('music').checked=musicOn;$('vibration').checked=vibe}
$('play').onclick=start;$('again').onclick=start;$('pause').onclick=pause;$('resume').onclick=resume;$('pause-home').onclick=$('over-home').onclick=()=>{state='home';panel('home');hud(false);stopMusic()};$('open-settings').onclick=()=>{sync();panel('settings')};$('settings-back').onclick=()=>panel('home');$('open-garage').onclick=()=>{tab='maps';garageUI()};document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{tab=b.dataset.tab;document.querySelectorAll('[data-tab]').forEach(q=>q.classList.toggle('active',q===b));garageUI()});$('garage-back').onclick=()=>panel('home');$('open-premium').onclick=()=>panel('premium');$('premium-back').onclick=()=>panel('home');$('quality').onchange=e=>{quality=e.target.value;localStorage.skyQuality=quality;toast(quality.toUpperCase()+' graphics enabled')};$('sound').onchange=e=>{soundOn=e.target.checked;localStorage.skySound=soundOn};$('music').onchange=e=>{musicOn=e.target.checked;localStorage.skyMusic=musicOn;if(musicOn&&state==='playing')startMusic();else stopMusic()};$('vibration').onchange=e=>{vibe=e.target.checked;localStorage.skyVibe=vibe};$('premium-demo').onclick=()=>toast('Payment is not connected yet. Ask a parent/guardian before setup.');c.addEventListener('pointerdown',e=>{e.preventDefault();flap()},{passive:false});addEventListener('keydown',e=>{if(e.code==='Space'||e.code==='ArrowUp'){e.preventDefault();if(state==='playing')flap();else if(state==='home')start();else if(state==='paused')resume()}});document.addEventListener('touchmove',e=>e.preventDefault(),{passive:false});rocket={x:W*.27,y:H*.44,vy:0,rot:0};$('home-best').textContent=best;panel('home');hud(false);requestAnimationFrame(loop);
})();
