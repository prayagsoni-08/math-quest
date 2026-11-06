const $=s=>document.querySelector(s),view=$('#view'),modal=$('#modal');
let sound=true,ac;
const beep=(f,d=.15)=>{if(!sound)return;try{ac=ac||new AudioContext();const o=ac.createOscillator(),g=ac.createGain();o.frequency.value=f;g.gain.value=.08;o.connect(g);g.connect(ac.destination);o.start();o.stop(ac.currentTime+d)}catch(e){}};
const ok=()=>{beep(660);setTimeout(()=>beep(880),120)},bad=()=>beep(180,.3);
const rnd=n=>Math.floor(Math.random()*n);
const shuffle=a=>a.map(x=>[Math.random(),x]).sort((p,q)=>p[0]-q[0]).map(x=>x[1]);
const show=(h,g)=>{$('#title').hidden=true;view.hidden=false;view.className=g?'gate':'';view.innerHTML=h};
const esc=s=>s.replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const goTitle=()=>{clearInterval(E&&E.iv);view.hidden=true;$('#title').hidden=false};
const modalOpen=h=>{modal.hidden=false;modal.innerHTML=`<div class="box">${h}<button class="btn" onclick="modal.hidden=true">Close</button></div>`};

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

let E,B;
let P={name:'Player 1',cls:''};
$('#b-start').onclick=()=>askName('part1');
$('#b-lb').onclick=leaderboard;
$('#b-snd').onclick=function(){sound=!sound;this.textContent=sound?'🔊':'🔇'};
function playStory(part){
 const lines=part==='part1' ? [
  ['Narrator','Long ago, this was a peaceful village.'],['Narrator','Then a shrill buzzing sound began echoing through its streets.'],['Villager','Please, make it stop! We cannot sleep or think with that sound.'],['Villager','It is coming from the abandoned house at the end of the road.'],['Student','I will go inside and find what is frightening everyone.'],['Narrator','You step into the abandoned house. Four locked rooms wait in the darkness.'],['Mysterious Voice','Answer each room’s question to earn its special key.'],['Mysterious Voice','Use each key to open the box holding the next room’s key.'],['Mysterious Voice','The final box contains the controller making that terrible sound.'],['Student','I will find it and help the villagers.']
 ] : [
  ['Narrator','The buzzing stops. Inside the final box, you discover its mysterious controller.'],['Student','The villagers are safe at last!'],['Narrator','Suddenly, the floor cracks and collapses beneath your feet.'],['Student','Whoa! Where am I?'],['Narrator','You have fallen into a maze. The exit is the only way out.'],['Mysterious Voice','Answer a maths question, then spin the wheel numbered 1 to 4.'],['Mysterious Voice','A correct answer moves you forward exactly the number of spaces you spin.'],['Mysterious Voice','A wrong answer still earns a spin, but sends you backward exactly that many spaces.'],['Student','I have to reach the exit to escape. Here goes!']
 ]; let n=0;
 const draw=()=>{const [who,line]=lines[n];const last=n===lines.length-1;show(`<p class="speaker">${who}</p><p class="q dialogue">“${line}”</p><div class="row"><button class="btn" onclick="storyNext('${part}')">${last?(part==='part1'?'Enter Part 1':'Enter Maze'):'Continue'}</button><button class="btn ghost" onclick="storySkip('${part}')">Skip</button></div>`,1)};
 window.storyNext=p=>{if(++n<lines.length)draw();else p==='part1'?startEscape():startBoard()};
 window.storySkip=p=>p==='part1'?startEscape():startBoard(); draw();
}
function askName(part='part1'){P.part=part;show(`<h2>${part==='part1'?'Part 1':'Part 2'} — What is your name, traveller?</h2><input id="nm" type="text" maxlength="16" placeholder="Your name" autocomplete="off" onkeydown="if(event.key==='Enter')saveName()"><div class="row"><button class="btn" onclick="saveName()">Next</button><button class="btn ghost" onclick="goTitle()">Back</button></div>`,1);$('#nm').focus()}
function saveName(){const v=$('#nm').value.trim();if(!v){$('#nm').focus();return}P.name=esc(v);askClass()}
function askClass(){show(`<h2>${P.name}, which class are you in?</h2><div class="grid">${[1,2,3,4,5,6,7,8,9,10,11,12].map(c=>`<button class="btn" onclick="pickClass('${c}')">${c}</button>`).join('')}</div><button class="btn ghost" onclick="askName('part1')">Back</button>`,1)}
function pickClass(c){P.cls=c;playStory('part1')}
function intro(){playStory('part1')}
const HOW=`<h2>How to play</h2><p><b>Part 1:</b> Answer each room’s question to earn its key. Each key opens the next key box; the fourth room reveals the controller.</p><p><b>Part 2:</b> Correct answers move forward by your 1–4 spin. Wrong answers move backward by the same spin. Reach the exit to escape.</p>`;
const lbGet=()=>{try{return JSON.parse(localStorage.getItem('mq_lb')||'[]')}catch(e){return[]}};
function saveScore(k,tl){try{const l=lbGet();l.push({n:P.name,c:P.cls,s:k*100+Math.max(tl,0)});l.sort((a,b)=>b.s-a.s);localStorage.setItem('mq_lb',JSON.stringify(l.slice(0,10)))}catch(e){}}
function leaderboard(){const l=lbGet();show(`<h2>🏆 Leaderboard</h2>${l.length?l.map((e,i)=>`<p class="lb"><span>${i+1}. ${e.n} · Class ${e.c}</span><b>${e.s}</b></p>`).join(''):'<p>No scores yet. Be the first!</p>'}<p><small>Score = 100 per key + seconds left</small></p><button class="btn ghost" onclick="goTitle()">Back</button>`)}

function startEscape(){E={r:0,keys:0,tries:0,hint:1,tl:600,qs:R.map(r=>r[1][rnd(2)])};clearInterval(E.iv);E.iv=setInterval(()=>{E.tl--;tick();if(E.tl<=0)lose()},1000);room()}
const tick=()=>{const t=$('#tm');if(t)t.textContent='⏳ '+Math.floor(Math.max(E.tl,0)/60)+':'+String(Math.max(E.tl,0)%60).padStart(2,'0')};
function room(){E.tries=0;show(`<div class="hud"><span id="tm"></span><span>🗝️ ${E.keys}/4</span></div><h2>Room ${E.r+1}: ${R[E.r][0]}</h2><p class="q">${E.qs[E.r][0]}</p><p id="fb" class="fb"></p><input id="ans" type="number" inputmode="numeric" onkeydown="if(event.key==='Enter')submitE()"><div class="row"><button class="btn" onclick="submitE()">Unlock</button><button class="btn ghost" id="hb" onclick="hintE()">Hint (${E.hint}) −30s</button></div>`);tick();$('#ans').focus()}
const fb=(t,b)=>{const f=$('#fb');f.textContent=t;f.className='fb'+(b?' bad':'')};
function hintE(){if(!E.hint)return;E.hint=0;E.tl-=30;$('#hb').disabled=true;fb('Hint: '+E.qs[E.r][2])}
function submitE(){const i=$('#ans');if(i.value==='')return;const c=E.qs[E.r],v=+i.value;i.value='';
 if(v===c[1]){ok();if(E.tries===2)E.tl-=30;fb('🗝️ Key earned! '+c[2]);nextRoom()}
 else{bad();E.tries++;if(E.tries===1)fb('Not quite. Try once more.',1);else if(E.tries===2)fb('Clue: '+c[2]+' Final recovery attempt (correct costs 30 s).',1);else{E.tl-=60;fb('The answer was '+c[1]+'. '+c[2]+' (−60 s)',1);nextRoom()}}}
function nextRoom(){$('#ans').disabled=true;setTimeout(()=>{E.keys++;E.r++;E.r===4?transition():room()},2200)}
function lose(){clearInterval(E.iv);saveScore(E.keys,0);show(`<h1>Time's up</h1><p class="q">The buzzing grows louder… You collected ${E.keys} of 4 keys.</p><button class="btn" onclick="startEscape()">Try again (new puzzles)</button><button class="btn ghost" onclick="goTitle()">Title</button>`)}
function transition(){clearInterval(E.iv);saveScore(E.keys,E.tl);playStory('part2')}

function startBoard(){B={p:0,deck:shuffle([...Array(14).keys()]),card:null};board()}
function board(msg=''){const cells=[...Array(15).keys()].map(i=>`<div class="cell${i===14?' fin':''}">${i===0?'START':i===14?'EXIT':i}<br>${B.p===i?'<span class="tok">🟠</span>':''}</div>`).join('');
 show(`<h2>${P.name}'s Maze</h2><div class="track">${cells}</div><p class="fb">${msg}</p><div id="act"><button class="btn" onclick="spin1()">Draw a question</button></div>`)}
function spin1(){const a=$('#act');a.innerHTML='<div id="sp">?</div>';let n=0;const iv=setInterval(()=>{$('#sp').textContent=1+rnd(14);if(++n>12){clearInterval(iv);const i=B.deck.pop();if(!B.deck.length)B.deck=shuffle([...Array(14).keys()]);B.card=i;ask()}},80)}
function ask(){const c=C[B.card];$('#act').innerHTML=`<div class="card"><small>Card ${B.card+1} · ${c[0]} · ${c[1]}</small><p class="q">${c[2]}</p><input id="ans" type="number" inputmode="numeric" onkeydown="if(event.key==='Enter')answerB()"><button class="btn" onclick="answerB()">Answer</button></div>`;$('#ans').focus()}
function answerB(){const i=$('#ans');if(i.value==='')return;const c=C[B.card];B.correct=(+i.value===c[3]);if(B.correct)ok();else bad();$('#act').innerHTML=`<p class="fb${B.correct?'':' bad'}">${B.correct?'✔ Correct!':'✘ Incorrect. The answer was '+c[3]+'.'} ${c[4]}</p><button class="btn" onclick="spin2()">🎡 Spin to move</button>`}
function spin2(){$('#act').innerHTML='<div id="sp">?</div>';let n=0;const iv=setInterval(()=>{$('#sp').textContent=1+rnd(4);if(++n>10){clearInterval(iv);const m=+$('#sp').textContent;B.p=Math.max(0,Math.min(14,B.p+(B.correct?m:-m)));if(B.p>=14)return finish();board(`${B.correct?'Correct: moved forward':'Wrong: moved backward'} ${m} ${m===1?'space':'spaces'}.`)}},80)}
function finish(){ok();show(`<h1>You escaped, ${P.name}!</h1><p class="q">You reached the maze exit, silenced the buzzing, and helped the village.<br><br>Concepts you practised: multiplication, division, percentages, fractions, algebra, area and powers.</p><button class="btn" onclick="playStory('part1')">Play again</button><button class="btn ghost" onclick="goTitle()">Title</button>`)}
