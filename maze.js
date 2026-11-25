const MAZE_PATH = [[1,7],[2,7],[3,7],[3,6],[3,5],[4,5],[5,5],[5,4],[5,3],[6,3],[7,3],[7,2],[7,1],[8,1],[9,1]];
const MAZE_APPROACH = [[0,7],[0,8],[1,8],[1,9]];
const MAZE_FORKS = {
  3: {wrong:[[2,6],[1,6],[1,5],[0,5]], extra:[[4,6],[4,7],[4,8],[4,9]]},
  7: {wrong:[[4,4],[3,4],[2,4],[2,3]]},
  11:{wrong:[[6,2],[5,2],[4,2],[3,2]], extra:[[8,2],[9,2],[10,2],[10,3]]}
};
const cellKey = ([x,y]) => x + ',' + y;
const mazeFloors = new Set([...MAZE_PATH,...MAZE_APPROACH, ...Object.values(MAZE_FORKS).flatMap(fork=>[...fork.wrong,...(fork.extra||[])])].map(cellKey));
const corridorEdges = new Set();
function connectTrail(trail){
  trail.slice(1).forEach((cell,i)=>corridorEdges.add([cellKey(cell),cellKey(trail[i])].sort().join('|')));
}
connectTrail(MAZE_PATH);
connectTrail([MAZE_PATH[0],...MAZE_APPROACH]);
for(const [index,fork] of Object.entries(MAZE_FORKS)){
  connectTrail([MAZE_PATH[index],...fork.wrong]);
  if(fork.extra)connectTrail([MAZE_PATH[index],...fork.extra]);
}
const flat = ([x,y], ox=0, oy=0, z=0) => `translate3d(${x*74+ox}px,${y*74+oy}px,${z}px)`;
const upright = (cell, x, y, height=16) => flat(cell,x,y,height) + ' rotateZ(10deg) rotateX(-40deg)';
function mazeMarkup(){
  let tiles='';
  for(let y=-1;y<=10;y++){
    for(let x=-1;x<=11;x++){
      const cell=[x,y];
      const floor=mazeFloors.has(cellKey(cell));
      const border=[[x,y+1],[x,y-1],[x+1,y],[x-1,y]].some(c=>mazeFloors.has(cellKey(c)));
      if(floor){
        tiles+=`<div class="tile" data-cell="${cellKey(cell)}" style="transform:${flat(cell)}"></div>`;
        for(const [dx,dy] of [[1,0],[0,1]]){
          const neighbor=cellKey([x+dx,y+dy]);
          const edge=[cellKey(cell),neighbor].sort().join('|');
          if(mazeFloors.has(neighbor)&&!corridorEdges.has(edge)){
            tiles+=`<div class="divider" style="transform:${flat(cell,dx*74,dy*74,13)} rotateZ(${dx*90}deg)"></div>`;
          }
        }
      }else if(border)tiles+=`<div class="wall" style="transform:${flat(cell)}"><span></span></div>`;
    }
  }
  const lanterns=[0,2,5,9,13,14].map(i=>`<i class="lantern" style="transform:${flat(MAZE_PATH[i],10,11,13)}"></i>`).join('');
  return `<div class="maze-window"><div class="maze-caption"><h1>The Moonlit Maze</h1><p id="maze-location"></p></div>
    <div class="camera"><div class="world"><div class="terrain">${tiles}${lanterns}
    <div class="stone exit" style="transform:${upright(MAZE_PATH.at(-1),14,23)}">Exit</div>
    <div id="maze-clues"></div><div id="route-marker"></div>
    <div id="traveller" class="traveller" aria-hidden="true"></div>
    </div></div></div></div>`;
}
function focusMaze(cell, walking=false){
  const viewport=document.querySelector('.maze-window');
  if(!viewport)return;
  const [x,y]=cell;
  const world=viewport.querySelector('.world');
  world.style.setProperty('--scale',Math.min(1.08,viewport.clientWidth/780,viewport.clientHeight/450));
  const terrain=viewport.querySelector('.terrain');
  terrain.style.setProperty('--pan-x',`${-x*74-37}px`);
  terrain.style.setProperty('--pan-y',`${-y*74-37}px`);
  for(const tile of viewport.querySelectorAll('.tile')){
    tile.classList.toggle('current',tile.dataset.cell===cellKey(cell));
  }
  const traveller=viewport.querySelector('#traveller');
  traveller.style.transform=upright(cell,24,0,9);
  traveller.classList.toggle('walking',walking);
}
function wrongRoute(index){
  const fork=MAZE_FORKS[index];
  if(fork)return fork.extra&&Math.random()<.5 ? fork.extra : fork.wrong;
  return [...MAZE_PATH.slice(0,index).reverse(),...MAZE_APPROACH].slice(0,4);
}

function clueStones(index,puzzle,detour){
  const sides=detour?[
    detour.cells[detour.depth-1],
    detour.cells[detour.depth-2]||MAZE_PATH[index]
  ]:[MAZE_FORKS[index]?.wrong[0]||MAZE_PATH[index],MAZE_FORKS[index]?.extra?.[0]||MAZE_PATH[index+1]];
  return puzzle.signs.map((value,i)=>`<div class="stone" style="transform:${upright(sides[i],i?31:0,i?34:4,25)}">${i+1} · ${value}</div>`).join('');
}
