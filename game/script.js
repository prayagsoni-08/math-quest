'use strict';

const $ = selector => document.querySelector(selector);
const game = $('#game');
const screen = $('#screen');
const hud = $('#hud');
const ROOMS = [
  {scene:'gate',name:'The Old Gate',title:'Unlock the gate',action:'Inspect gate lock',x:66,y:48},
  {scene:'cellar',name:'The Cellar',title:'Unlock the chest',action:'Inspect chest lock',x:66,y:40},
  {scene:'tower',name:'The Clock Tower',title:'Set the brass hand',action:'Inspect clock',x:63,y:24},
  {scene:'chapel',name:'The Chapel',title:'Unlock the altar',action:'Inspect the altar',x:50,y:45}
];
const storage = {
  get(key,fallback){
    try{return JSON.parse(localStorage.getItem('mathquest.v2.'+key)) ?? fallback;}
    catch{return fallback;}
  },
  set(key,value){
    try{localStorage.setItem('mathquest.v2.'+key,JSON.stringify(value));return true;}
    catch{return false;}
  },
  remove(key){
    try{localStorage.removeItem('mathquest.v2.'+key);}
    catch{}
  }
};
const escapeHTML = value => String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const duration = seconds => `${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}`;
const random = max => Math.floor(Math.random()*max);
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const wait = ms => new Promise(resolve=>setTimeout(resolve,reducedMotion.matches?30:ms));

let profile = storage.get('profile',null);
let checkpoint = storage.get('checkpoint',null);
let sound = storage.get('sound',true);
let run = null;
let maze = null;
let stage = 'menu';
let roomPosition = 0;
let sceneVersion = 0;
let hasGesture = false;
const tracks = {
  tension: new Audio('tension.mp3'),
  buzzing: new Audio('buzzing.mp3'),
  click: new Audio('click.mp3')
};
tracks.tension.loop = tracks.buzzing.loop = true;
tracks.tension.volume = .35;
tracks.buzzing.volume = .34;
tracks.click.volume = .55;
let activeTrack = null;
let audioContext;

function playFeedback(correct){
  if(!sound)return;
  try{
    audioContext ||= new AudioContext();
    const tone=audioContext.createOscillator();
    const volume=audioContext.createGain();
    tone.frequency.value=correct?660:196;
    volume.gain.value=.065;
    volume.gain.exponentialRampToValueAtTime(.001,audioContext.currentTime+.27);
    tone.connect(volume).connect(audioContext.destination);
    tone.start();
    tone.stop(audioContext.currentTime+.28);
  }catch{}
}

function updateSound(){
  const target=sound&&hasGesture ? (stage==='room'?'buzzing':'tension') : null;
  if(activeTrack!==target){
    if(activeTrack)tracks[activeTrack].pause();
    activeTrack=target;
    if(target)tracks[target].play().catch(()=>{activeTrack=null;});
  }
  $('#sound').textContent=sound?'Mute':'Unmute';
  $('#sound').setAttribute('aria-pressed',String(!sound));
}

function show(next,scene,markup){
  sceneVersion++;
  stage=next;
  game.dataset.scene=scene;
  game.dataset.screen=next;
  $('#home').hidden=next==='menu';
  screen.innerHTML=markup;
  drawHUD();
  updateSound();
  if(next!=='maze')screen.querySelector('h1,h2')?.focus({preventScroll:true});
}

function announce(message){
  $('#announcement').textContent=message;
}

function panel(title,content,style=''){
  return `<div class="panel${style?' '+style:''}"><h1 tabindex="-1">${title}</h1>${content}</div>`;
}

function isActive(){
  return !!run&&['story','room','reveal','maze'].includes(stage);
}

function drawHUD(){
  hud.innerHTML=isActive()? `<span class="pill">${run.room}/4 keys</span>` : '';
}

function saveCheckpoint(phase,extra={}){
  checkpoint={...run,phase,...extra};
  storage.set('checkpoint',checkpoint);
}
function clearCheckpoint(){
  checkpoint=null;
  storage.remove('checkpoint');
}
function activeProfileHasRun(){
  return checkpoint&&profile&&checkpoint.player.id===profile.id;
}

function mainMenu(){
  run=null;
  maze=null;
  const resume=activeProfileHasRun();
  show('menu','village',`<div class="menu">
    <h1 tabindex="-1" aria-label="Math-Quest"><img class="title-logo" src="math-quest-title.png" alt="Math-Quest" fetchpriority="high"></h1>
    <div class="menu-buttons">
      <button class="primary" data-action="${resume?'continue':'play'}"><i class="menu-icon play-icon" aria-hidden="true"></i>${resume?'Continue':'Play'}</button>
      <button class="secondary" data-action="leaderboard"><i class="menu-icon trophy-icon" aria-hidden="true"><span></span></i>Leaderboard</button>
      <button class="secondary" data-action="new-game"><i class="menu-icon restart-icon" aria-hidden="true"></i>New Game</button>
    </div>
  </div>`);
}

function showPlayerDetails(){
  const options=Array.from({length:12},(_,i)=>`<option value="${i+1}">Class ${i+1}</option>`).join('');
  show('profile','village',`<div class="panel quest-board player-board">
    <h1 tabindex="-1">Player details</h1>
    <form id="player-form">
      <label for="name">${sharedLeaderboard?'Leaderboard nickname':'Player name'}</label>
      <input id="name" name="name" maxlength="24" autocomplete="nickname" required>
      <label for="grade">Class</label>
      <select id="grade" name="grade" required><option value="">Choose your class</option>${options}</select>
      <div class="actions"><button type="submit">Start adventure</button><button class="secondary" type="button" data-action="menu">Back</button></div>
    </form>
  </div>`);
}

function newGame(){
  profile=null;
  run=null;
  maze=null;
  storage.remove('profile');
  clearCheckpoint();
  showPlayerDetails();
}

function startRun(){
  if(!profile)return showPlayerDetails();
  const started=Date.now();
  run={
    id:profile.id+'-'+started,player:{...profile},
    started,room:0
  };
  saveCheckpoint('story');
  story();
  registerOnlineRun(run);
}
function story(){
  show('story','village',panel('A buzz beyond the gate',`
    <p>“That buzzing came from the old house. Can you find out what’s making it?”</p>
    <div class="actions"><button data-action="enter-room">Approach the old gate</button></div>`,'quest-board story-board'));
}
function resume(){
  if(!activeProfileHasRun())return startRun();
  run={...checkpoint};
  delete run.mode;
  delete run.deadline;
  if(run.phase==='story')return story();
  if(run.phase==='room')return showRoom();
  if(run.phase==='reveal')return reveal();
  startMaze(run.maze);
}
function showRoom(){
  roomPosition=run.room===2?Number(run.clockCard?.split('-')[0]||0):0;
  const room=ROOMS[run.room];
  saveCheckpoint('room');
  show('room',room.scene,`<div class="room-scene">
    <div class="room-title"><p>Room ${run.room+1} of 4</p><h1 tabindex="-1">${room.name}</h1></div>
    <button class="hotspot" style="--x:${room.x}%;--y:${room.y}%" data-action="inspect" aria-controls="room-panel" aria-expanded="false">${room.action}</button>
    <div id="room-panel" class="panel quest-board" hidden></div>
  </div>`);
}

function drawQuestion(grade,cards=QUESTION_BANK[grade]){
  const history=storage.get('question-history-v3', {});
  let seen=new Set(history[grade]||[]);
  const last=Array.from(seen).at(-1);
  let remaining=cards.filter(card=>!seen.has(card.id));
  if(!remaining.length){
    seen=new Set(last?[last]:[]);
    remaining=cards.filter(card=>!seen.has(card.id));
  }
  const lastTopic=cards.find(card=>card.id===last)?.topic;
  const varied=lastTopic?remaining.filter(card=>card.topic!==lastTopic):[];
  const pool=varied.length?varied:remaining;
  const card=pool[random(pool.length)];
  seen.add(card.id);
  history[grade]=Array.from(seen);
  storage.set('question-history-v3',history);
  return card;
}

function roomPuzzle(){
  const grade=run.player.grade;
  const room=run.room;
  if(room===2){
    const cards=clockCards(grade);
    const saved=cards.find(card=>card.id===run.clockCard);
    if(saved)return saved;
    const card=drawQuestion('clock-'+grade,cards);
    run.clockCard=card.id;
    roomPosition=card.anchor;
    saveCheckpoint('room');
    return card;
  }
  run.roomCards ||= {};
  const saved=QUESTION_BANK[grade].find(card=>card.id===run.roomCards[room]);
  if(saved)return saved;
  const card=drawQuestion(grade);
  run.roomCards[room]=card.id;
  saveCheckpoint('room');
  return card;
}

function clockCards(grade){
  const cards=[];
  const anchors=grade<=3?1:12;
  const distances=grade<=3?12:grade<=7?11:6;
  for(let anchor=0;anchor<anchors;anchor++){
    for(let target=1;target<=distances;target++){
      const mark=anchor||12;
      let text,clue;
      if(grade<=3){
        text=`Tap the number for ${target} o’clock to move the brass hand.`;
        clue=`The hour is ${target}. Find that number on the clock.`;
      }else if(grade<=7){
        text=`Start at ${mark}. Move the brass hand ${target*5} minutes clockwise. Each gap is 5 minutes.`;
        clue=`Divide ${target*5} by 5 to find how many gaps to count clockwise from ${mark}.`;
      }else{
        text=`The silver hand points to ${mark}. Move the brass hand so the smaller angle is ${target*30}°. Each gap is 30°. Count either way from ${mark}.`;
        clue=`Divide ${target*30}° by 30° to find how many gaps to count from ${mark}.`;
      }
      cards.push({id:`${anchor}-${target}`,anchor,target,text,clue});
    }
  }
  return cards;
}

function numberForm(id,label,button){
  return `<form class="answer" id="${id}"><label><span class="sr">${label}</span><input placeholder="${label}" name="answer" type="number" inputmode="decimal" step="any" required></label><button type="submit">${button}</button></form>`;
}

function showRoomPuzzle(){
  const puzzle=roomPuzzle();
  const roomPanel=$('#room-panel');
  if(!roomPanel)return;
  const clock=run.room===2;
  const marks=clock?Array.from({length:12},(_,i)=>{
    const angle=i*Math.PI/6;
    return `<button class="mark" style="left:${50+40*Math.sin(angle)}%;top:${50-40*Math.cos(angle)}%" data-action="dial" data-value="${i}" aria-pressed="${i===roomPosition}">${i||12}</button>`;
  }).join(''):'';
  roomPanel.innerHTML=`<h2 tabindex="-1">${ROOMS[run.room].title}</h2>
    <div class="${clock?'clock-puzzle':''}">
      ${clock?`<div class="dial" aria-label="Clock dial"><i class="hand" style="transform:rotate(${puzzle.anchor*30}deg)"></i><i class="hand" id="moving-hand" style="transform:rotate(${roomPosition*30}deg)"></i>${marks}</div>`:''}
      <div class="question-content"><p class="question-text">${puzzle.text}</p>
      ${puzzle.signs?`<p class="clue-values">First plaque ${puzzle.signs[0]} · Second plaque ${puzzle.signs[1]}</p>`: ''}
      ${clock?'<div class="actions"><button data-action="check-clock">Test the lock</button></div>':numberForm('room-answer','Your answer','Unlock')}</div>
    </div>`;
  roomPanel.hidden=false;
  $('[data-action=inspect]').setAttribute('aria-expanded','true');
  roomPanel.querySelector('h2').focus({preventScroll:true});
}

function moveHand(value){
  roomPosition=value;
  $('#moving-hand').style.transform=`rotate(${value*30}deg)`;
  screen.querySelectorAll('.mark').forEach(mark=>mark.setAttribute('aria-pressed',String(Number(mark.dataset.value)===value)));
  announce(`Brass hand points to ${value||12}.`);
}

function checkRoom(value){
  if(stage!=='room'||!run)return;
  const puzzle=roomPuzzle();
  const grade=run.player.grade;
  const clock=run.room===2;
  const clockwise=(roomPosition-(puzzle.anchor||0)+12)%12;
  const distance=Math.min(clockwise,12-clockwise);
  const correct=clock
    ? (grade<=3?(roomPosition||12):grade<=7?clockwise:distance)===puzzle.target
    : value===puzzle.answer;
  if(correct){
    playFeedback(true);
    $('#room-panel').innerHTML=`<h2 tabindex="-1">Key earned</h2><p>${clock?'The gears turn and a brass key drops out.':'The lock clicks open. A key is inside.'}</p>
      <div class="actions"><button data-action="next-room">${run.room===3?'Open the final box':'Use the key'}</button></div>`;
    $('[data-action=inspect]').disabled=true;
    $('#room-panel h2').focus();
    return;
  }
  playFeedback(false);
  let explanation;
  let task;
  let answer;
  if(clock){
    const step=grade>=8?30:5;
    const gaps=grade>=8?distance:clockwise;
    explanation=grade<=3?`The brass hand points to ${roomPosition||12}.`:`The hand moved ${gaps} gaps. Each gap is ${step}${grade>=8?'°':' minutes'}.`;
    task=grade<=3?'Which number is at the very top of the dial?':`What is ${gaps} × ${step}?`;
    answer=grade<=3?12:gaps*step;
  }else{
    explanation=puzzle.clue;
    task='Enter the result from the worked clue to reset the lock.';
    answer=puzzle.answer;
  }
  const roomPanel=$('#room-panel');
  roomPanel.dataset.recovery=answer;
  roomPanel.innerHTML=`<h2 tabindex="-1">Reset the lock</h2><p>${explanation}</p><p>${task}</p>${numberForm('recovery-answer','Your answer','Reset')}<div id="recovery-feedback" aria-live="polite"></div>`;
  $('[data-action=inspect]').disabled=true;
  roomPanel.querySelector('h2').focus();
}

function unlockNext(){
  run.room++;
  if(run.room===4){
    saveCheckpoint('reveal');
    reveal();
  }else showRoom();
}
function reveal(){
  show('reveal','reveal',panel('The buzzing stops',`<p>You switch off the controller. The floor gives way beneath the box, and you land in a moonlit maze.</p>
    <div class="actions"><button data-action="enter-maze">Enter the maze</button></div>`));
}

function startMaze(saved){
  const index=saved?.index||0;
  const card=QUESTION_BANK[run.player.grade].find(q=>q.id===saved?.cardId) || drawQuestion(run.player.grade);
  const state=saved?.cardId && ['puzzle','spin','follow'].includes(saved.state)?saved.state:'puzzle';
  maze={index,steps:saved?.steps||0,angle:0,state,card,
    correct:saved?.correct,roll:saved?.roll,wrong:saved?.wrong,
    detour:saved?.detour?{...saved.detour}:null, message:''};
  maze.cell=maze.detour?.cells[maze.detour.depth-1]||MAZE_PATH[index];
  saveMaze();
  show('maze','maze',`<div class="board-layout">${mazeMarkup()}
    <section class="panel quest-board maze-controls" id="maze-controls"></section></div>`);
  if(stage!=='maze')return;
  focusMaze(maze.cell);
  if(maze.state==='follow'&&!selectedRoute().length)return nextMazeQuestion();
  drawMaze();
}

function saveMaze(state=maze.state){
  const {index,steps,card,correct,roll,wrong,detour}=maze;
  saveCheckpoint('maze',{maze:{index,steps,state,cardId:card.id,correct,roll,wrong,detour:detour?{...detour}:null}});
}

function wheel(){
  return `<div class="wheel-shell" aria-hidden="true"><div class="pointer"></div>
    <div class="wheel" id="wheel" style="transform:rotate(${maze.angle}deg)"><span style="left:50%;top:17%">1</span><span style="left:83%;top:50%">2</span><span style="left:50%;top:83%">3</span><span style="left:17%;top:50%">4</span></div></div>`;
}

function selectedRoute(){
  const {index,steps,correct,roll,wrong,detour}=maze;
  const distance=roll||4;
  if(!correct){
    return (detour?detour.cells.slice(detour.depth):wrong).slice(0,distance);
  }
  const route=detour
    ? [...detour.cells.slice(0,detour.depth-1).reverse(),MAZE_PATH[index]]
    : [];
  route.push(...MAZE_PATH.slice(index+1));
  return route.slice(0,distance+steps);
}

function drawMaze(focus=false){
  const {index,steps,state,card,correct,roll,detour}=maze;
  const showsRoute=['spin','spinning','follow'].includes(state);
  const route=showsRoute?selectedRoute():[];
  const routeCells=new Set(route.map(cellKey));
  const heading=correct?'Correct route':'Wrong route';
  $('#maze-location').textContent=`Exit progress ${index}/${MAZE_PATH.length-1}${detour?' · Detour':''}${steps?` · ${steps} carried ${steps===1?'step':'steps'}`:''}`;
  $('#maze-clues').innerHTML=state==='puzzle'?clueStones(index,card,detour):'';
  $('#route-marker').innerHTML=state==='follow'&&route.length
    ? `<button class="route-pin ${correct?'':'wrong-route'}" style="transform:${upright(route[0],-14,8,47)}" data-action="follow">${correct?'Follow path':'Take detour'}</button>`
    : '';
  const taken=new Set(MAZE_PATH.slice(0,index+1).map(cellKey));
  screen.querySelectorAll('.tile').forEach(tile=>{
    tile.classList.toggle('visited',taken.has(tile.dataset.cell));
    tile.classList.toggle('lit',routeCells.has(tile.dataset.cell)&&correct);
    tile.classList.toggle('wrong',routeCells.has(tile.dataset.cell)&&!correct);
    tile.classList.toggle('current',tile.dataset.cell===cellKey(maze.cell));
  });
  const controls=$('#maze-controls');
  if(state==='spin'||state==='spinning'){
    const detail=correct ? (detour?'The lit route leads back toward the exit.':'The lit route heads toward the exit.')
      : (route.length?'The orange route takes you farther from the exit.':'A wall blocks the detour. The next question will appear here.');
    controls.innerHTML=`<div class="wheel-area">${wheel()}<div><h2 tabindex="-1">${heading}</h2>
      <p>${detail} Spin for 1–4 spaces.</p>
      <div class="actions"><button data-action="spin" ${state==='spinning'?'disabled':''}>${state==='spin'?'Spin wheel':'Spinning…'}</button></div>
    </div></div>`;
  }else if(state==='puzzle'){
    controls.innerHTML=`<h2 tabindex="-1">${detour?'Detour puzzle':MAZE_FORKS[index]?'Solve the fork puzzle':'Solve a puzzle to spin'}</h2><p class="question-text">${card.text}</p>
      <p class="clue-values">First plaque ${card.signs[0]} · Second plaque ${card.signs[1]}</p>
      ${numberForm('maze-answer','Your answer','Check answer')}`;
  }else if(state==='follow'){
    controls.innerHTML=`<h2 tabindex="-1">You spun ${roll}</h2><p>${correct?'Follow the lit route toward the exit.':'Follow the orange route to your next question.'}${correct&&steps?` You also have ${steps} carried from the previous spin.`:''}</p>
      <div class="actions"><button data-action="follow">${correct?'Follow path':'Take detour'}</button></div>`;
  }else{
    const status=state==='moving'?'Walking toward the exit…':'Walking the detour…';
    controls.innerHTML=`<h2 tabindex="-1">${status}</h2><p>${maze.message}</p>`;
  }
  if(focus)controls.querySelector('h2')?.focus({preventScroll:true});
}

function stillInMaze(version){
  return stage==='maze'&&sceneVersion===version;
}

function answerMaze(value){
  if(maze.state!=='puzzle')return;
  maze.correct=value===maze.card.answer;
  maze.wrong=maze.correct||maze.detour?null:wrongRoute(maze.index);
  maze.state='spin';
  playFeedback(maze.correct);
  saveMaze();
  drawMaze(true);
}

async function spin(){
  if(maze.state!=='spin')return;
  const version=sceneVersion;
  const roll=1+random(4);
  const stop=[0,270,180,90][roll-1];
  maze.state='spinning';
  maze.roll=roll;
  saveMaze('follow');
  drawMaze();
  const disc=$('#wheel');
  disc.getBoundingClientRect();
  maze.angle=360*(Math.floor(maze.angle/360)+4)+stop;
  disc.style.transform=`rotate(${maze.angle}deg)`;
  await wait(1200);
  if(!stillInMaze(version))return;
  maze.state='follow';
  announce(`You spun ${roll}.`);
  if(!selectedRoute().length)return nextMazeQuestion();
  drawMaze(true);
}

function nextMazeQuestion(){
  maze.card=drawQuestion(run.player.grade);
  maze.roll=null;
  maze.correct=null;
  maze.wrong=null;
  maze.state='puzzle';
  focusMaze(maze.cell);
  saveMaze();
  drawMaze(true);
}

async function follow(){
  if(maze.state!=='follow')return;
  const version=sceneVersion;
  const route=selectedRoute();
  maze.message=`Wheel: ${maze.roll}${maze.correct&&maze.steps?` · Carried steps: ${maze.steps}`:''}`;
  if(maze.correct){
    maze.steps+=maze.roll;
    maze.state='moving';
  }else{
    maze.detour ||= {cells:maze.wrong,depth:0};
    maze.state='detour';
  }
  drawMaze();
  for(const cell of route){
    maze.cell=cell;
    const advancing=maze.correct&&!maze.detour;
    if(maze.correct){
      maze.steps--;
      if(advancing)maze.index++;
      else if(--maze.detour.depth===0)maze.detour=null;
    }else{
      maze.detour.depth++;
    }
    focusMaze(cell,true);
    $('#maze-location').textContent=`Exit progress ${maze.index}/${MAZE_PATH.length-1}${maze.detour?' · Detour':''}`;
    await wait(385);
    if(!stillInMaze(version))return;
    if(advancing&&maze.index===MAZE_PATH.length-1)return complete();
    if(advancing&&MAZE_FORKS[maze.index])break;
  }
  nextMazeQuestion();
}

const supabase = window.MATH_QUEST_SUPABASE || {};
const sharedLeaderboard = location.protocol !== 'file:'
  && /^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(supabase.url || '')
  && /^sb_publishable_/.test(supabase.publishableKey || '');
const leaderboardFunctions={
  runs:'math_quest_start_run',
  finish:'math_quest_finish_run',
  leaderboard:'math_quest_leaderboard'
};

async function leaderboardRequest(path,body={}){
  const response=await fetch(supabase.url.replace(/\/$/,'')+'/rest/v1/rpc/'+leaderboardFunctions[path],{
    method:'POST',
    headers:{'Content-Type':'application/json',apikey:supabase.publishableKey},
    body:JSON.stringify(body),
    signal:AbortSignal.timeout(8000)
  });
  if(!response.ok)throw new Error('Leaderboard unavailable');
  return response.json();
}

async function registerOnlineRun(attempt){
  if(!sharedLeaderboard||attempt.onlineId)return;
  try{
    const {id}=await leaderboardRequest('runs',{player_name:attempt.player.name,player_grade:attempt.player.grade});
    if(run!==attempt&&checkpoint?.id!==attempt.id)return;
    attempt.onlineId=id;
    if(checkpoint?.id===attempt.id){
      checkpoint={...checkpoint,onlineId:id};
      storage.set('checkpoint',checkpoint);
      if(run?.id===attempt.id)run.onlineId=id;
    }
  }catch{}
}

async function submitOnlineFinish(id){
  const result=await leaderboardRequest('finish',{run_id:id});
  storage.set('pending-finishes',storage.get('pending-finishes',[]).filter(item=>item!==id));
  return result.elapsed;
}

function complete(){
  const finished=run;
  const elapsed=Math.max(0,Math.floor((Date.now()-run.started)/1000));
  const scores=storage.get('scores',[]);
  const saved=storage.set('scores',[
    ...scores.filter(score=>score.id!==finished.id),
    {id:finished.id,name:finished.player.name,grade:finished.player.grade,elapsed}
  ]);
  clearCheckpoint();
  run=null;
  maze=null;
  playFeedback(true);
  const status=sharedLeaderboard
    ? (finished.onlineId?'Posting your finish…':'Saved on this device. A live run could not be registered.')
    : (saved?'Your finish is on this device’s leaderboard.':'The browser could not save your finish.');
  show('finish','maze',panel('You escaped!',`<p>${escapeHTML(finished.player.name)}, you found all four keys, stopped the buzzing, and reached the maze exit.</p>
    <p id="finish-status" aria-live="polite">Finish time ${duration(elapsed)}. ${status}</p>
    <div class="actions"><button data-action="leaderboard">Leaderboard</button><button class="secondary" data-action="menu">Back to Menu</button></div>`));
  if(!sharedLeaderboard||!finished.onlineId)return;
  const id=finished.onlineId;
  const version=sceneVersion;
  storage.set('pending-finishes',[...new Set([...storage.get('pending-finishes',[]),id])]);
  submitOnlineFinish(id).then(time=>{
    if(sceneVersion===version)$('#finish-status').textContent=`Finish time ${duration(time)}. Your finish is on the shared leaderboard.`;
  }).catch(()=>{
    if(sceneVersion===version)$('#finish-status').textContent=`Finish time ${duration(elapsed)}. Open the leaderboard to retry posting your finish.`;
  });
}

function leaderboardRows(scores){
  const rows=scores.map((score,i)=>`<tr><td>${i+1}</td><th scope="row">${escapeHTML(score.name)}</th><td>${score.grade}</td><td>${duration(score.elapsed)}</td></tr>`).join('');
  return rows?`<div class="table-shell"><table aria-label="Full-game finishes by completion time"><thead><tr><th scope="col">Rank</th><th scope="col">Player</th><th scope="col">Class</th><th scope="col">Finish time</th></tr></thead><tbody>${rows}</tbody></table></div>`
    : '<p class="empty-scores">No full-game finishes yet.</p>';
}

let leaderboardRefreshActive=false;
async function refreshLeaderboard(){
  if(stage!=='scores'||leaderboardRefreshActive)return;
  leaderboardRefreshActive=true;
  const version=sceneVersion;
  try{
    await Promise.allSettled(storage.get('pending-finishes',[]).map(submitOnlineFinish));
    const {scores}=await leaderboardRequest('leaderboard');
    if(sceneVersion===version)$('#live-scores').innerHTML=leaderboardRows(scores);
  }catch{
    if(sceneVersion===version&&!$('#live-scores').querySelector('table')){
      $('#live-scores').innerHTML='<p class="empty-scores">Couldn’t load live scores. Retrying shortly…</p>';
    }
  }finally{
    leaderboardRefreshActive=false;
  }
}

function leaderboard(){
  const content=sharedLeaderboard
    ? '<p class="empty-scores">Loading live scores…</p>'
    : leaderboardRows(storage.get('scores',[]).sort((a,b)=>a.elapsed-b.elapsed).slice(0,10));
  show('scores','village',`<div class="panel quest-board score-board">
    <h1 tabindex="-1">Leaderboard</h1>
    <span class="score-ornament" aria-hidden="true">✦</span>
    <p class="score-subtitle">${sharedLeaderboard?'Live · Full-game finishes':'Full-game finishes on this device'}</p>
    <div id="live-scores">${content}</div>
    <div class="actions"><button class="secondary" data-action="menu">Back to menu</button></div>
  </div>`);
  if(sharedLeaderboard)refreshLeaderboard();
}
if(sharedLeaderboard)setInterval(refreshLeaderboard,12000);

$('#home').addEventListener('click',()=>{
  if(stage!=='menu')mainMenu();
});
$('#sound').addEventListener('click',()=>{
  sound=!sound;
  storage.set('sound',sound);
  updateSound();
});
document.addEventListener('click',event=>{
  const button=event.target.closest('button');
  if(!button||button.disabled)return;
  hasGesture=true;
  updateSound();
  if(sound){
    tracks.click.currentTime=0;
    tracks.click.play().catch(()=>{});
  }
},true);

const actions={
  play:startRun, continue:resume, menu:mainMenu,
  'new-game':newGame, leaderboard,
  'enter-room':showRoom, inspect:showRoomPuzzle,
  dial:button=>moveHand(Number(button.dataset.value)),
  'check-clock':()=>checkRoom(), 'next-room':unlockNext,
  'enter-maze':()=>startMaze(), spin, follow
};

screen.addEventListener('click',event=>{
  const button=event.target.closest('[data-action]');
  if(!button||button.disabled)return;
  actions[button.dataset.action]?.(button);
});
screen.addEventListener('submit',event=>{
  event.preventDefault();
  const form=event.target;
  const values=new FormData(form);
  if(form.id==='player-form'){
    const name=String(values.get('name')).trim();
    const grade=Number(values.get('grade'));
    if(!name||!Number.isInteger(grade)||grade<1||grade>12)return $('#name').focus();
    profile={name,grade,id:profile?.id||String(Date.now())};
    storage.set('profile',profile);
    startRun();
  }else if(form.id==='room-answer')checkRoom(Number(values.get('answer')));
  else if(form.id==='maze-answer')answerMaze(Number(values.get('answer')));
  else if(form.id==='recovery-answer'){
    if(Number(values.get('answer'))===Number($('#room-panel').dataset.recovery)){
      $('[data-action=inspect]').disabled=false;
      showRoomPuzzle();
      announce('Lock reset. Try the original puzzle again.');
    }else $('#recovery-feedback').textContent='Read the clue above and try the reset again.';
  }
});
window.addEventListener('resize',()=>{
  if(stage==='maze'&&maze)focusMaze(maze.cell);
});
mainMenu();
