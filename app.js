const $=s=>document.querySelector(s);
const memories=[
{i:0,t:'My favorite place is next to you.',d:'OUR LITTLE WORLD'},
{i:11,t:'Every adventure is better with you.',d:'JULY 1'},
{i:1,t:'A little pink, a little magic, a lot of us.',d:'JULY 3'},
{i:12,t:'Always my favorite teammate.',d:'JULY 3'},
{i:2,t:'Our own little summer escape.',d:'JULY 6'},
{i:3,t:'I would find you in any world.',d:'JULY 6'},
{i:4,t:'Two names. One little forever.',d:'JULY 24'},
{i:5,t:'Close, even from far away.',d:'JULY 25'},
{i:6,t:'Somewhere, under the same moon.',d:'JULY 30'},
{i:7,t:'The quiet moments mean everything.',d:'AUGUST 25'},
{i:8,t:'You feel like home.',d:'AUGUST 25'},
{i:10,t:'And our story is still being written.',d:'TO BE CONTINUED…'}];
const chapterNames=['My favorite person','Our little universe','Our little film','A letter for you','One last wish'];
const nextLabels=['Our little universe','Our little film','A letter for you','One last wish'];
let chapter=0,furthest=0,opened=false,changing=false,memoryIndex=0,musicWanted=true,resumeAfterVideo=false;
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,music=$('#music'),movie=$('#movie');
music.volume=.36;
function soundState(){const active=!music.paused;$('#sound').classList.toggle('playing',active);$('#sound').setAttribute('aria-pressed',String(active));$('#sound').setAttribute('aria-label',active?'Pause music':'Play music');$('#sound-label').textContent=active?'Music on':'Music off'}
function startMusic(){musicWanted=true;return music.play().then(soundState).catch(()=>{soundState();$('#sound-label').textContent='Tap for music'})}
music.addEventListener('play',soundState);music.addEventListener('pause',soundState);
$('#sound').onclick=()=>{if(!music.paused){musicWanted=false;resumeAfterVideo=false;music.pause()}else{if(!movie.paused)movie.pause();startMusic()}};
$('#open').onclick=()=>{
 if(opened)return;opened=true;startMusic();$('#open').disabled=true;
 $('#gift-status').textContent='Opening your gift…';$('#gift').classList.add('unwrapping');
 if(!reduced)setTimeout(()=>magicBurst(.5,.42,1,40),1350);
 setTimeout(()=>{$('#gift').hidden=true;$('#story').hidden=false;showChapter(0,false)},reduced?0:3300);
};
function syncNav(){$('#back').disabled=chapter===0;$('#next').hidden=chapter===4;$('#next').innerHTML=(nextLabels[chapter]||'')+' <span aria-hidden="true">→</span>';document.querySelectorAll('#chapter-dots button').forEach((b,i)=>{b.classList.toggle('current',i===chapter);b.disabled=i>furthest;b.setAttribute('aria-current',i===chapter?'step':'false')})}
function showChapter(index,animate=true){if(!opened||changing||index<0||index>4)return;const old=$('#page-'+chapter);changing=true;if(chapter===2&&!movie.paused)movie.pause();if(animate)old.classList.add('leaving');setTimeout(()=>{document.querySelectorAll('.page').forEach(p=>{p.hidden=true;p.classList.remove('leaving')});chapter=index;document.body.dataset.chapter=String(index);furthest=Math.max(furthest,index);$('#page-'+chapter).hidden=false;if(index===1)preloadNeighbors(memoryIndex);syncNav();window.scrollTo({top:0,behavior:'instant'});$('#title-'+chapter).focus({preventScroll:true});changing=false},animate&&!reduced?240:0)}
chapterNames.forEach((name,i)=>{const b=document.createElement('button');b.setAttribute('aria-label',name);b.onclick=()=>showChapter(i);$('#chapter-dots').append(b)});
$('#next').onclick=()=>showChapter(chapter+1);$('#back').onclick=()=>showChapter(chapter-1);$('#replay').onclick=()=>showChapter(0);
const imageCache=new Map();let desiredMemory=0,memoryBusy=false,worldLayer=0,memoryInitialized=false,lastDirection=1;
function loadPicture(src){if(imageCache.has(src))return imageCache.get(src);const job=new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>{if(im.decode)im.decode().catch(()=>{}).then(()=>resolve(src));else resolve(src)};im.onerror=()=>{imageCache.delete(src);reject(new Error('Image unavailable'))};im.src=src});imageCache.set(src,job);return job}
function backgroundFor(i){return `assets/worlds/memory-${memories[i].i}.webp`}
function preloadNeighbors(i){[i,(i+1)%memories.length,(i-1+memories.length)%memories.length].forEach(n=>{loadPicture(backgroundFor(n)).catch(()=>{});loadPicture(`assets/memory-${memories[n].i}.png`).catch(()=>{})})}
function paintMemory(index){memoryIndex=index;const m=memories[index];$('#memory-image').src=`assets/memory-${m.i}.png`;$('#memory-image').alt=m.t;$('#enlarge').style.setProperty('--photo-bg',`url("${backgroundFor(index)}")`);$('#memory-caption').textContent=m.t;$('#memory-date').textContent=m.d;$('#memory-number').textContent=`${String(index+1).padStart(2,'0')} / ${memories.length}`;document.querySelectorAll('#memory-dots button').forEach((b,i)=>{b.classList.toggle('current',i===index);b.setAttribute('aria-pressed',String(i===index))})}
function paintWorld(src,instant=false){const next=worldLayer===0?$('#world-b'):$('#world-a');const old=worldLayer===0?$('#world-a'):$('#world-b');next.src=src;next.style.transition=instant?'none':'';next.classList.add('visible');old.classList.remove('visible');worldLayer=1-worldLayer}
function finishedAnimation(element,frames,options){if(reduced)return Promise.resolve();const a=element.animate(frames,options);return a.finished.catch(()=>{}).then(()=>a.cancel())}
async function travelMemories(){
 if(memoryBusy)return;memoryBusy=true;$('#page-1').setAttribute('aria-busy','true');
 try{while(desiredMemory!==memoryIndex||!memoryInitialized){
  let target=desiredMemory;const photo=`assets/memory-${memories[target].i}.png`;
  $('#memory-status').textContent=memoryInitialized?'Opening another little memory…':'';
  let backdrop=backgroundFor(target);try{await Promise.all([loadPicture(photo),loadPicture(backdrop)])}catch{try{await loadPicture(photo);backdrop=photo}catch{$('#memory-status').textContent='This memory could not open. Try another one.';desiredMemory=memoryIndex;break}}
  if(target!==desiredMemory)continue;
  const direction=lastDirection,card=$('.memory-card');
  const animate=memoryInitialized&&chapter===1&&!reduced;
  if(animate){magicBurst(direction>0?.66:.34,.48,direction,25);await finishedAnimation(card,[{transform:'translateX(0) rotate(-1.4deg)',opacity:1},{transform:`translateX(${-direction*70}px) rotateY(${-direction*12}deg) rotate(${-direction*4}deg) scale(.94)`,opacity:0}],{duration:320,easing:'cubic-bezier(.4,0,.7,.2)',fill:'forwards'});}
  // Read the newest target on the next loop if the visitor clicked again during the exit.
  paintMemory(target);paintWorld(backdrop,!memoryInitialized);memoryInitialized=true;
  if(animate)await finishedAnimation(card,[{transform:`translateX(${direction*90}px) rotateY(${direction*13}deg) rotate(${direction*3}deg) scale(.95)`,opacity:0},{transform:'translateX(0) rotateY(0) rotate(-1.4deg) scale(1)',opacity:1}],{duration:760,easing:'cubic-bezier(.16,1,.3,1)',fill:'both'});
  preloadNeighbors(target);$('#memory-status').textContent='';
 }}finally{memoryBusy=false;$('#page-1').setAttribute('aria-busy','false')}
}
function showMemory(index,direction){const target=(index+memories.length)%memories.length;lastDirection=direction||Math.sign(target-desiredMemory)||1;desiredMemory=target;travelMemories()}
function magicBurst(x,y,direction=1,total=25){if(reduced)return;const host=$('#magic-trail');for(let i=0;i<total;i++){const p=document.createElement('i');p.className='magic-mote'+(i%6===0?' star':'');if(i%6===0)p.textContent='✧';p.style.left=(x*100+(Math.random()-.5)*14)+'vw';p.style.top=(y*100+(Math.random()-.5)*35)+'vh';p.style.setProperty('--size',(i%6===0?12+Math.random()*9:2+Math.random()*3)+'px');p.style.setProperty('--dx',(direction*(80+Math.random()*240))+'px');p.style.setProperty('--dy',(-30-Math.random()*170)+'px');p.style.setProperty('--life',(950+Math.random()*900)+'ms');p.style.animationDelay=(Math.random()*180)+'ms';host.append(p);setTimeout(()=>p.remove(),2200)}}
memories.forEach((m,i)=>{const b=document.createElement('button');b.setAttribute('aria-label',`Memory ${i+1}: ${m.t}`);b.onclick=()=>showMemory(i);$('#memory-dots').append(b)});
$('#memory-prev').onclick=()=>showMemory(desiredMemory-1,-1);$('#memory-next').onclick=()=>showMemory(desiredMemory+1,1);paintMemory(0);showMemory(0);
const box=$('#lightbox');$('#enlarge').onclick=()=>{const m=memories[memoryIndex];box.querySelector('img').src=`assets/memory-${m.i}.png`;box.querySelector('img').alt=m.t;box.querySelector('p').textContent=m.t;box.showModal()};$('#close').onclick=()=>box.close();box.addEventListener('click',e=>{if(e.target===box)box.close()});
let touchX=0,suppressImageClick=false;$('#memory-image').addEventListener('touchstart',e=>{touchX=e.changedTouches[0].screenX},{passive:true});$('#memory-image').addEventListener('touchend',e=>{const dx=e.changedTouches[0].screenX-touchX;if(Math.abs(dx)>45){suppressImageClick=true;showMemory(desiredMemory+(dx<0?1:-1),dx<0?1:-1);setTimeout(()=>suppressImageClick=false,350)}},{passive:true});$('#enlarge').addEventListener('click',e=>{if(suppressImageClick){e.preventDefault();e.stopImmediatePropagation()}},true);
document.addEventListener('keydown',e=>{if(!opened||box.open||e.target.closest('video'))return;if(e.key==='ArrowRight'){e.preventDefault();chapter===1?showMemory(desiredMemory+1,1):showChapter(chapter+1)}if(e.key==='ArrowLeft'){e.preventDefault();chapter===1?showMemory(desiredMemory-1,-1):showChapter(chapter-1)}});
movie.addEventListener('play',()=>{resumeAfterVideo=musicWanted;music.pause()});movie.addEventListener('pause',()=>{if(resumeAfterVideo&&musicWanted&&opened)startMusic()});movie.addEventListener('ended',()=>{if(musicWanted)startMusic()});
function count(){const diff=Math.max(0,new Date('2026-09-28T00:00:00+08:00')-Date.now());$('#countdown').innerHTML=diff?[[Math.floor(diff/86400000),'days'],[Math.floor(diff/3600000)%24,'hours'],[Math.floor(diff/60000)%60,'minutes'],[Math.floor(diff/1000)%60,'seconds']].map(([n,t])=>`<div><b>${String(n).padStart(2,'0')}</b><small>${t}</small></div>`).join(''):'<b>Happy birthday, my love ♡</b>';if(!diff)$('#count-label').textContent='Your special day is here'}count();setInterval(count,1000);
$('#wish').onclick=()=>{$('#wish-message').textContent='May your sweetest wish find its way to you.';$('#wish').textContent='A little wish, sent to the stars ♡';if(reduced)return;const r=$('#wish').getBoundingClientRect();for(let i=0;i<35;i++){const p=document.createElement('span');p.className='wish-particle';p.textContent=i%3?'✧':'♡';p.style.left=(r.x+r.width/2)+'px';p.style.top=(r.y+r.height/2)+'px';p.style.setProperty('--x',(Math.random()-.5)*650+'px');p.style.setProperty('--y',(-100-Math.random()*600)+'px');document.body.append(p);setTimeout(()=>p.remove(),2600)}};
for(let i=0;i<44;i++){const s=document.createElement('i');s.className='dust';s.style.left=Math.random()*100+'%';s.style.top=Math.random()*100+'%';s.style.setProperty('--duration',3+Math.random()*5+'s');s.style.animationDelay=-Math.random()*8+'s';$('#stardust').append(s)}
