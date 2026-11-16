const $=s=>document.querySelector(s),view=$('#view'),modal=$('#modal'),stage=$('#stage');
let sound=true,ac;
const beep=(f,d=.15)=>{if(!sound)return;try{ac=ac||new AudioContext();const o=ac.createOscillator(),g=ac.createGain();o.frequency.value=f;g.gain.value=.08;o.connect(g);g.connect(ac.destination);o.start();o.stop(ac.currentTime+d)}catch(e){}};
const ok=()=>{beep(660);setTimeout(()=>beep(880),120)},bad=()=>beep(180,.3);
const rnd=n=>Math.floor(Math.random()*n);
const shuffle=a=>a.map(x=>[Math.random(),x]).sort((p,q)=>p[0]-q[0]).map(x=>x[1]);
/* Each screen sets a background key; style.css maps keys to images (with fallbacks). */
const setBg=k=>{stage.dataset.bg=k||'menu'};
const show=(h,g,bg,screen)=>{$('#title').hidden=true;view.hidden=false;view.className=g?'gate':'';view.innerHTML=h;setBg(bg);currentScreen=screen||bg||'screen';$('#b-back').hidden=false};
const esc=s=>s.replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const goTitle=()=>{if(E?.iv)clearInterval(E.iv);if(E?.advanceTimer)clearTimeout(E.advanceTimer);E=null;B=null;view.hidden=true;$('#title').hidden=false;$('#b-back').hidden=true;currentScreen='title';setBg('menu')};
const modalOpen=h=>{modal.hidden=false;modal.innerHTML=`<div class="box">${h}<button class="btn" onclick="modal.hidden=true">Close</button></div>`};
function handleBack(){
 if((currentScreen.startsWith('room')&&E?.iv)||(currentScreen==='maze'&&B)){confirmLeaveGame();return}
 if(currentScreen==='name')return goTitle();
 if(currentScreen==='class')return askName();
 if(currentScreen==='board')return askClass();
 if(currentScreen==='leaderboard')return goTitle();
 return partBoard();
}
function confirmLeaveGame(){
 if(E?.iv){clearInterval(E.iv);E.iv=null;E.pausedForBack=true}
 if(B?.spinTimer){clearTimeout(B.spinTimer);B.spinTimer=null;B.pausedSpin=true}
 modal.hidden=false;
 modal.innerHTML=`<div class="box"><h2>Leave this challenge?</h2><p>Your progress in this run will be lost. Continue to the parts board?</p><div class="row"><button class="btn ghost" onclick="stayInGame()">Stay in Game</button><button class="btn" onclick="leaveGameToBoard()">Continue</button></div></div>`;
}
function stayInGame(){modal.hidden=true;if(E?.pausedForBack){E.pausedForBack=false;E.iv=setInterval(()=>{E.tl--;tick();if(E.tl<=0)lose()},1000)}if(B?.pausedSpin){B.pausedSpin=false;resumeSpin()}}
function leaveGameToBoard(){if(E?.iv)clearInterval(E.iv);if(E?.advanceTimer)clearTimeout(E.advanceTimer);if(B?.spinTimer)clearTimeout(B.spinTimer);E=null;B=null;modal.hidden=true;partBoard()}

const R=[["The Old Gate",[["The rusted lock reads: 7 × 8 = ?",56,"7 × 8 = 7 × 10 − 7 × 2."],["The rusted lock reads: 6 × 9 = ?",54,"6 × 9 = 6 × 10 − 6."]]],
["The Cellar",[["Barrel code: 144 ÷ 12 + 15 = ?",27,"Divide first, then add."],["Barrel code: 132 ÷ 12 + 18 = ?",29,"Divide first, then add."]]],
["The Clock Tower",[["The hands stop at x, where 3x + 7 = 40. x = ?",11,"Subtract 7, then divide by 3."],["The hands stop at x, where 4x + 5 = 37. x = ?",8,"Subtract 5, then divide by 4."]]],
["The Chapel",[["Triangle window: base 14, height 9. What is its area?",63,"Area = ½ × base × height."],["Triangle window: base 12, height 11. What is its area?",66,"Area = ½ × base × height."]]]];
const C=[["Easy","Addition","What is 15 + 27?",42,"Add tens (10 + 20), then ones (5 + 7): 42."],
["Easy","Multiplication","What is 9 × 6?",54,"9 × 6 = 10 × 6 − 6 = 54."],
["Easy","Subtraction","What is 100 − 37?",63,"Count up from 37 to 100: 3 + 60 = 63."],
["Easy","Division","What is 72 ÷ 8?",9,"8 × 9 = 72."],
["Medium","Percentages","What is 25% of 240?",60,"25% is a quarter: 240 ÷ 4 = 60."],
["Medium","Fractions","What is 3/4 of 48?",36,"48 ÷ 4 = 12, then × 3 = 36."],
["Medium","Algebra","Solve 2x − 5 = 17. x = ?",11,"Add 5 to get 2x = 22, then halve."],
["Medium","Squares","What is 12²?",144,"12 × 12 = 144."],
["Medium","Perimeter","Perimeter of a 9 by 6 rectangle?",30,"2 × (9 + 6) = 30."],
["Medium","Roots","What is √196?",14,"14 × 14 = 196."],
["Hard","Percentages","What is 18% of 350?",63,"10% = 35 and 8% = 28, so 63."],
["Hard","Algebra","Solve 3x + 2(x − 4) = 22. x = ?",6,"5x − 8 = 22, so 5x = 30."],
["Hard","Circles","Area of a circle, radius 7 (use π = 22/7)?",154,"π r² = 22/7 × 49 = 154."],
["Hard","Powers","What is 2⁵ + 3³?",59,"32 + 27 = 59."]];

let E,B,part1Cleared=false;
let P={name:'Player 1',cls:''};
let currentScreen='title';
$('#b-start').onclick=()=>{part1Cleared=false;askName()};
$('#b-lb').onclick=leaderboard;
$('#b-snd').onclick=function(){sound=!sound;this.textContent=sound?'🔊':'🔇'};
$('#b-back').onclick=handleBack;

/* ---------- Story (Part 1 and Part 2) ---------- */
function playStory(part){
 const lines=part==='part1' ? [
  ['Narrator','Long ago, this was a peaceful village.'],['Narrator','Then a shrill buzzing sound began echoing through its streets.'],['Villager','Please, make it stop! We cannot sleep or think with that sound.'],['Villager','It is coming from the abandoned house at the end of the road.'],['Student','I will go inside and find what is frightening everyone.'],['Narrator','You step into the abandoned house. Four locked rooms wait in the darkness.'],['Mysterious Voice','Answer each room’s question to earn its special key.'],['Mysterious Voice','Use each key to open the box holding the next room’s key.'],['Mysterious Voice','The final box contains the controller making that terrible sound.'],['Student','I will find it and help the villagers.']
 ] : [
  ['Narrator','The buzzing stops. Inside the final box, you discover its mysterious controller.'],['Student','The villagers are safe at last!'],['Narrator','Suddenly, the floor cracks and collapses beneath your feet.'],['Student','Whoa! Where am I?'],['Narrator','You have fallen into a maze. The exit is the only way out.'],['Mysterious Voice','Answer a maths question, then spin the wheel numbered 1 to 4.'],['Mysterious Voice','A correct answer moves you forward exactly the number of spaces you spin.'],['Mysterious Voice','A wrong answer still earns a spin, but sends you backward exactly that many spaces.'],['Student','I have to reach the exit to escape. Here goes!']
 ]; let n=0;
 /* Part 1: village road first, then the abandoned house. Part 2: controller, then the maze. */
 const bgFor=i=>part==='part1'?(i<5?'village':'house'):(i<2?'cleared':'mazestory');
 const draw=()=>{const [who,line]=lines[n];const last=n===lines.length-1;show(`<p class="speaker">${who}</p><p class="q dialogue">“${line}”</p><div class="row"><button class="btn" onclick="storyNext('${part}')">${last?(part==='part1'?'Enter Room 1':'Enter Maze'):'Continue'}</button>${last?'':`<button class="btn ghost" onclick="storySkip('${part}')">Skip</button>`}</div>`,1,bgFor(n),part==='part1'?'story1':'story2')};
 window.storyNext=p=>{if(++n<lines.length)draw();else p==='part1'?startEscape():startBoard()};
 window.storySkip=p=>{n=lines.length-1;draw()}; draw();
}

/* ---------- Name, class, part board ---------- */
function askName(){show(`<h2>What is your name, traveller?</h2><input id="nm" type="text" maxlength="16" placeholder="Your name" autocomplete="off" onkeydown="if(event.key==='Enter')saveName()"><div class="row"><button class="btn" onclick="saveName()">Next</button></div>`,1,'name');$('#nm').focus()}
function saveName(){const v=$('#nm').value.trim();if(!v){$('#nm').focus();return}P.name=esc(v);askClass()}
function askClass(){show(`<h2>${P.name}, which class are you in?</h2><p class="q">Choose your class to set the maths difficulty.</p><div class="grid">${[1,2,3,4,5,6,7,8,9,10,11,12].map(c=>`<button class="btn" onclick="pickClass('${c}')">${c}</button>`).join('')}</div>`,1,'class')}
function pickClass(c){P.cls=c;partBoard()}
function intro(){partBoard()}
function partBoard(){show(`<h1>Choose a Part</h1><p class="q">Complete each part to unlock the next challenge.</p>
<div class="part-card"><div class="doors" aria-hidden="true"><i>🚪</i><i>🚪</i><i>🚪</i><i>🚪</i></div><h2>${part1Cleared?'✅ Part 1: The Abandoned House':'Part 1: The Abandoned House'}</h2><p>Earn four keys, open the final box, and stop the buzzing.</p><button class="btn" onclick="playStory('part1')">${part1Cleared?'Replay Part 1':'Start Part 1'}</button></div>
<div class="part-card ${part1Cleared?'':'locked'}"><div class="doors" aria-hidden="true"><i>🌀</i>${part1Cleared?'':'<i class="lock">🔒</i>'}</div><h2>${part1Cleared?'Part 2: The Maze':'Part 2: The Maze'}</h2><p>${part1Cleared?'Unlocked! Solve questions and spin toward the exit.':'Clear Part 1 to unlock this challenge.'}</p><button class="btn" ${part1Cleared?'onclick="playStory(\'part2\')"':'disabled'}>${part1Cleared?'Start Part 2':'Locked'}</button></div>
`,1,'board')}

/* ---------- Leaderboard ---------- */
const HOW=`<h2>How to play</h2><p><b>Part 1:</b> Answer each room’s question to earn its key. Each key opens the next key box; the fourth room reveals the controller.</p><p><b>Part 2:</b> Correct answers move forward by your 1–4 spin. Wrong answers move backward by the same spin. Reach the exit to escape.</p>`;
const lbGet=()=>{try{return JSON.parse(localStorage.getItem('mq_lb')||'[]')}catch(e){return[]}};
function saveScore(k,tl){try{const l=lbGet();l.push({n:P.name,c:P.cls,s:k*100+Math.max(tl,0)});l.sort((a,b)=>b.s-a.s);localStorage.setItem('mq_lb',JSON.stringify(l.slice(0,10)))}catch(e){}}
function leaderboard(){const l=lbGet();show(`<h2>🏆 Leaderboard</h2>${l.length?l.map((e,i)=>`<p class="lb"><span>${i+1}. ${e.n} · Class ${e.c}</span><b>${e.s}</b></p>`).join(''):'<p>No scores yet. Be the first!</p>'}<p><small>Score = 100 per key + seconds left</small></p>`,0,'class','leaderboard')}

/* ---------- Part 1: four rooms ---------- */
function startEscape(){if(E?.iv)clearInterval(E.iv);if(E?.advanceTimer)clearTimeout(E.advanceTimer);E={r:0,keys:0,tries:0,hint:1,tl:600,qs:R.map(r=>r[1][rnd(2)])};E.iv=setInterval(()=>{E.tl--;tick();if(E.tl<=0)lose()},1000);room()}
const tick=()=>{const t=$('#tm');if(t)t.textContent='⏳ '+Math.floor(Math.max(E.tl,0)/60)+':'+String(Math.max(E.tl,0)%60).padStart(2,'0')};
function room(){E.tries=0;show(`<div class="hud"><span id="tm"></span><span>🗝️ ${E.keys}/4</span></div><h2>Room ${E.r+1}: ${R[E.r][0]}</h2><p class="q">${E.qs[E.r][0]}</p><p id="fb" class="fb" aria-live="polite"></p><div id="recovery"></div><input id="ans" type="number" inputmode="numeric" onkeydown="if(event.key==='Enter')submitE()"><div class="row"><button class="btn" id="submit-room" onclick="submitE()">Unlock</button><button class="btn ghost" id="hb" onclick="hintE()">Hint (${E.hint}) −30s</button></div>`,0,'room'+(E.r+1));tick();$('#ans').focus()}
const fb=(t,b)=>{const f=$('#fb');f.textContent=t;f.className='fb'+(b?' bad':'')};
function hintE(){if(!E.hint)return;E.hint=0;E.tl-=30;$('#hb').disabled=true;fb('Hint: '+E.qs[E.r][2])}
function submitE(){const i=$('#ans');if(i.value===''||i.disabled)return;const c=E.qs[E.r],v=+i.value;i.value='';
 if(v===c[1]){ok();if(E.tries===2)E.tl-=30;fb('🗝️ Key earned! '+c[2]);nextRoom()}
 else{bad();E.tries++;if(E.tries===1)fb('Not quite. Try once more.',1);else if(E.tries===2)fb('Clue: '+c[2]+' One more attempt.',1);else{E.tl-=45;fb('No key yet. Review the clue, then try this room again. '+c[2]+' (−45 s)',1);i.disabled=true;$('#submit-room').disabled=true;$('#hb').disabled=true;$('#recovery').innerHTML='<button class="btn ghost" onclick="room()">Review clue and retry room</button>'}}}
function nextRoom(){$('#ans').disabled=true;$('#submit-room').disabled=true;$('#hb').disabled=true;E.advanceTimer=setTimeout(()=>{if(!E||E.tl<=0)return;E.keys++;E.r++;E.r===4?transition():room()},1200)}
function lose(){if(!E)return;clearInterval(E.iv);if(E.advanceTimer)clearTimeout(E.advanceTimer);saveScore(E.keys,0);show(`<h1>Time's up</h1><p class="q">The buzzing grows louder… You collected ${E.keys} of 4 keys.</p><div class="row"><button class="btn" onclick="startEscape()">Try Again</button><button class="btn ghost" onclick="partBoard()">Parts Board</button></div>`,1,'house','retry')}
function transition(){clearInterval(E.iv);saveScore(E.keys,E.tl);part1Cleared=true;show(`<h1>Part 1 Cleared!</h1><p class="q">You found the controller and stopped the shrill buzzing. The villagers are safe. Your next challenge is now unlocked.</p><div class="row"><button class="btn" onclick="playStory('part2')">Start Part 2</button><button class="btn ghost" onclick="partBoard()">Parts Board</button></div>`,1,'cleared')}

/* ---------- Part 2: maze ---------- */
function startBoard(){const cls=+P.cls||12;const allowed=C.map((q,i)=>({q,i})).filter(({q})=>cls<=6?q[0]==='Easy':cls<=9?q[0]!=='Hard':true).map(x=>x.i);B={p:0,deck:shuffle(allowed),card:null,wheelAngle:0};board()}
function board(msg=''){const first=B.p-4;const cells=Array.from({length:15},(_,j)=>{const i=first+j;const atStart=i===0,atExit=i===14;return `<div class="cell${atExit?' fin':''}${i===B.p?' current':''}">${atStart?'START':atExit?'EXIT':i}<br>${B.p===i?'<span class="tok">🟠</span>':''}</div>`}).join('');const distance=14-B.p;
 show(`<h2>${P.name}'s Maze</h2><p class="maze-progress">${distance} spaces to the exit</p><div class="track">${cells}</div><p class="fb" aria-live="polite">${msg}</p><div id="act"><button class="btn" onclick="drawQuestion()">Get a maths question</button></div>`,0,'maze')}
function drawQuestion(){const pool=B.deck.length?B.deck:(B.deck=shuffle(C.map((q,i)=>i)));B.card=pool.pop();ask()}
function ask(){const c=C[B.card];$('#act').innerHTML=`<div class="card"><small>Card ${B.card+1} · ${c[0]} · ${c[1]}</small><p class="q">${c[2]}</p><input id="ans" type="number" inputmode="numeric" onkeydown="if(event.key==='Enter')answerB()"><button class="btn" onclick="answerB()">Answer</button></div>`;$('#ans').focus()}
function answerB(){const i=$('#ans');if(i.value===''||i.disabled)return;const c=C[B.card];B.correct=(+i.value===c[3]);i.disabled=true;if(B.correct)ok();else bad();$('#act').innerHTML=`<p class="fb${B.correct?'':' bad'}" aria-live="polite">${B.correct?'✔ Correct!':'✘ Incorrect. The answer was '+c[3]+'.'} ${c[4]}</p><div class="wheel-wrap" role="img" aria-label="Four-section wheel, numbered one to four"><div class="wheel-pointer" aria-hidden="true"></div><div class="wheel" id="wheel" style="transform:rotate(${B.wheelAngle}deg)"><span class="wheel-label">1</span><span class="wheel-label">2</span><span class="wheel-label">3</span><span class="wheel-label">4</span><span class="wheel-hub" aria-hidden="true"></span></div></div><button class="btn" id="spin-button" onclick="spin2()">🎡 Spin the wheel</button>`}
function spin2(){const button=$('#spin-button'),wheel=$('#wheel');if(!button||button.disabled)return;button.disabled=true;const spaces=1+rnd(4),target=(360-(spaces-1)*90)%360,offset=(target-(B.wheelAngle%360)+360)%360;B.wheelAngle+=5*360+offset+rnd(3)*360;wheel.style.transform=`rotate(${B.wheelAngle}deg)`;B.spinning=true;B.spinSpaces=spaces;B.spinTimer=setTimeout(()=>{if(!B)return;B.spinTimer=null;B.spinning=false;applySpin()},matchMedia('(prefers-reduced-motion: reduce)').matches?180:2900)}
function applySpin(){if(!B)return;const spaces=B.spinSpaces;B.p+=(B.correct?1:-1)*spaces;if(B.correct&&B.p>=14)return finish();board(`${B.correct?'Correct · moved forward':'Incorrect · moved backward'} ${spaces} ${spaces===1?'space':'spaces'}.`)}
function resumeSpin(){if(!B?.spinning)return;const wheel=$('#wheel');if(wheel)wheel.style.transform=`rotate(${B.wheelAngle}deg)`;B.spinTimer=setTimeout(()=>{if(!B)return;B.spinTimer=null;B.spinning=false;applySpin()},2900)}
function finish(){ok();show(`<h1>You escaped, ${P.name}!</h1><p class="q">You reached the maze exit, silenced the buzzing, and helped the village.<br><br>Concepts you practised: multiplication, division, percentages, fractions, algebra, area and powers.</p><div class="row"><button class="btn" onclick="part1Cleared=false;partBoard()">Play Again</button><button class="btn ghost" onclick="partBoard()">Parts Board</button></div>`,1,'escape')}
