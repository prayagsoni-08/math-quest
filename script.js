const $=s=>document.querySelector(s),view=$('#view'),modal=$('#modal');
let sound=true,ac;
const beep=(f,d=.15)=>{if(!sound)return;try{ac=ac||new AudioContext();const o=ac.createOscillator(),g=ac.createGain();o.frequency.value=f;g.gain.value=.08;o.connect(g);g.connect(ac.destination);o.start();o.stop(ac.currentTime+d)}catch(e){}};
const ok=()=>{beep(660);setTimeout(()=>beep(880),120)},bad=()=>beep(180,.3);
const rnd=n=>Math.floor(Math.random()*n);
const shuffle=a=>a.map(x=>[Math.random(),x]).sort((p,q)=>p[0]-q[0]).map(x=>x[1]);
const show=h=>{$('#title').hidden=true;view.hidden=false;view.innerHTML=h};
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
$('#b-start').onclick=()=>show(`<h1>Math-Quest</h1><p class="q">The village holds a secret. A strange buzzing comes from a locked treasure box.<br><br>Solve four rooms in 10 minutes to collect four keys and silence it. Then race a rival through Math-O-Quest.</p><button class="btn" onclick="startEscape()">Enter the village</button><button class="btn ghost" onclick="goTitle()">Back</button>`);
$('#b-how').onclick=()=>modalOpen(`<h2>How to play</h2><p><b>Part 1:</b> four rooms, one question each. Two tries, then a clue and a final attempt (30 s penalty). One hint token for the whole escape (−30 s).</p><p><b>Part 2:</b> two players take turns. Spin for a card, answer it, then spin 1–4 spaces forward. A wrong answer sends you back 2 unless your shield absorbs it. Reach or pass FINISH to win.</p>`);
$('#b-set').onclick=()=>{modalOpen(`<h2>Settings</h2><button class="btn ghost" id="snd" onclick="sound=!sound;this.textContent='Sound: '+(sound?'On':'Off')">Sound: ${sound?'On':'Off'}</button>`)};
$('#b-cred').onclick=()=>modalOpen(`<h2>Credits</h2><p>Math-Quest: a combined maths escape and board game. Concept from the Combined Maths Challenge guide.</p>`);

function startEscape(){E={r:0,keys:0,tries:0,hint:1,tl:600,qs:R.map(r=>r[1][rnd(2)])};clearInterval(E.iv);E.iv=setInterval(()=>{E.tl--;tick();if(E.tl<=0)lose()},1000);room()}
const tick=()=>{const t=$('#tm');if(t)t.textContent='⏳ '+Math.floor(Math.max(E.tl,0)/60)+':'+String(Math.max(E.tl,0)%60).padStart(2,'0')};
function room(){E.tries=0;show(`<div class="hud"><span id="tm"></span><span>🗝️ ${E.keys}/4</span></div><h2>Room ${E.r+1}: ${R[E.r][0]}</h2><p class="q">${E.qs[E.r][0]}</p><p id="fb" class="fb"></p><input id="ans" type="number" inputmode="numeric" onkeydown="if(event.key==='Enter')submitE()"><div class="row"><button class="btn" onclick="submitE()">Unlock</button><button class="btn ghost" id="hb" onclick="hintE()">Hint (${E.hint}) −30s</button></div>`);tick();$('#ans').focus()}
const fb=(t,b)=>{const f=$('#fb');f.textContent=t;f.className='fb'+(b?' bad':'')};
function hintE(){if(!E.hint)return;E.hint=0;E.tl-=30;$('#hb').disabled=true;fb('Hint: '+E.qs[E.r][2])}
function submitE(){const i=$('#ans');if(i.value==='')return;const c=E.qs[E.r],v=+i.value;i.value='';
 if(v===c[1]){ok();if(E.tries===2)E.tl-=30;fb('🗝️ Key earned! '+c[2]);nextRoom()}
 else{bad();E.tries++;if(E.tries===1)fb('Not quite. Try once more.',1);else if(E.tries===2)fb('Clue: '+c[2]+' Final recovery attempt (correct costs 30 s).',1);else{E.tl-=60;fb('The answer was '+c[1]+'. '+c[2]+' (−60 s)',1);nextRoom()}}}
function nextRoom(){$('#ans').disabled=true;setTimeout(()=>{E.keys++;E.r++;E.r===4?transition():room()},2200)}
function lose(){clearInterval(E.iv);show(`<h1>Time's up</h1><p class="q">The buzzing grows louder… You collected ${E.keys} of 4 keys.</p><button class="btn" onclick="startEscape()">Try again (new puzzles)</button><button class="btn ghost" onclick="goTitle()">Title</button>`)}
function transition(){clearInterval(E.iv);show(`<h1>The box opens!</h1><p class="q">The buzzing stops, and inside lies an old map of the village track.<br><br>Time left: ${Math.max(E.tl,0)} s. Now a rival challenges you to Math-O-Quest.</p><button class="btn" onclick="startBoard()">Begin Math-O-Quest</button>`)}

function startBoard(){B={p:[0,0],sh:[1,1],t:0,deck:shuffle([...Array(14).keys()]),card:null};board()}
function board(msg=''){const cells=[...Array(15).keys()].map(i=>`<div class="cell${i===14?' fin':''}">${i===0?'START':i===14?'FINISH':i}<br>${B.p.map((p,k)=>p===i?`<span class="tok">${k?'🔵':'🟠'}</span>`:'').join('')}</div>`).join('');
 show(`<h2>${B.t?'🔵 Player 2':'🟠 Player 1'}'s turn</h2><div class="track">${cells}</div><p>🛡️ Shields: P1 ${B.sh[0]} · P2 ${B.sh[1]}</p><p class="fb">${msg}</p><div id="act"><button class="btn" onclick="spin1()">🎡 Spin for a card</button></div>`)}
function spin1(){const a=$('#act');a.innerHTML='<div id="sp">?</div>';let n=0;const iv=setInterval(()=>{$('#sp').textContent=1+rnd(14);if(++n>12){clearInterval(iv);const i=B.deck.pop();if(!B.deck.length)B.deck=shuffle([...Array(14).keys()]);B.card=i;ask()}},80)}
function ask(){const c=C[B.card];$('#act').innerHTML=`<div class="card"><small>Card ${B.card+1} · ${c[0]} · ${c[1]}</small><p class="q">${c[2]}</p><input id="ans" type="number" inputmode="numeric" onkeydown="if(event.key==='Enter')answerB()"><button class="btn" onclick="answerB()">Answer</button></div>`;$('#ans').focus()}
function answerB(){const i=$('#ans');if(i.value==='')return;const c=C[B.card];
 if(+i.value===c[3]){ok();$('#act').innerHTML=`<p class="fb">✔ Correct! ${c[4]}</p><button class="btn" onclick="spin2()">🎡 Spin to move</button>`}
 else{bad();let m;if(B.sh[B.t]){B.sh[B.t]=0;m='🛡️ Your shield absorbed the setback.'}else{B.p[B.t]=Math.max(0,B.p[B.t]-2);m='Back 2 spaces.'}
  $('#act').innerHTML=`<p class="fb bad">✘ The answer was ${c[3]}. ${c[4]} ${m}</p><button class="btn" onclick="B.t=1-B.t;board()">Next player</button>`}}
function spin2(){$('#act').innerHTML='<div id="sp">?</div>';let n=0;const iv=setInterval(()=>{$('#sp').textContent=1+rnd(4);if(++n>10){clearInterval(iv);const m=+$('#sp').textContent;B.p[B.t]=Math.min(14,B.p[B.t]+m);if(B.p[B.t]>=14)return finish();B.t=1-B.t;board(`Moved forward ${m}!`)}},80)}
function finish(){ok();show(`<h1>${B.t?'🔵 Player 2':'🟠 Player 1'} wins!</h1><p class="q">You silenced the buzzing and crossed the village.<br><br>Concepts you practised: multiplication, division, percentages, fractions, algebra, area and powers.</p><button class="btn" onclick="startEscape()">Play again (new set)</button><button class="btn ghost" onclick="goTitle()">Title</button>`)}
