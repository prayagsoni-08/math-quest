const $=s=>document.querySelector(s),view=$('#view'),modal=$('#modal'),stage=$('#stage');
let sound=true,ac,revealTimer=null,ambientPrimed=false,activeTrack=null;
const clickAudio=new Audio('click.mp3'),tensionAudio=new Audio('tension.mp3'),buzzingAudio=new Audio('buzzing.mp3');
tensionAudio.loop=true;tensionAudio.volume=.42;buzzingAudio.loop=true;buzzingAudio.volume=.48;clickAudio.volume=.65;
function stopAmbient(){tensionAudio.pause();buzzingAudio.pause();activeTrack=null}
function syncAmbient(){if(!sound){stopAmbient();return}const inPartOne=(currentScreen?.startsWith('room')||currentScreen==='retry')&&E;const target=inPartOne?'buzzing':'tension';const audio=target==='buzzing'?buzzingAudio:tensionAudio;if(activeTrack===audio&&!audio.paused)return;tensionAudio.pause();buzzingAudio.pause();if(activeTrack!==audio)audio.currentTime=0;activeTrack=audio;audio.play().catch(()=>{ambientPrimed=false})}
document.addEventListener('click',event=>{if(!stage.contains(event.target))return;if(sound){clickAudio.currentTime=0;clickAudio.play().catch(()=>{});if(!ambientPrimed){ambientPrimed=true;syncAmbient()}}},true);
$('#title').style.visibility='hidden';setTimeout(()=>{$('#title').style.visibility=''},900);
const beep=(f,d=.15)=>{if(!sound)return;try{ac=ac||new AudioContext();const o=ac.createOscillator(),g=ac.createGain();o.frequency.value=f;g.gain.value=.08;o.connect(g);g.connect(ac.destination);o.start();o.stop(ac.currentTime+d)}catch(e){}};
const ok=()=>{beep(660);setTimeout(()=>beep(880),120)},bad=()=>beep(180,.3);
const rnd=n=>Math.floor(Math.random()*n);
const shuffle=a=>a.map(x=>[Math.random(),x]).sort((p,q)=>p[0]-q[0]).map(x=>x[1]);
/* Each screen sets a background key; style.css maps keys to images (with fallbacks). */
const setBg=k=>{stage.dataset.bg=k||'menu'};
const show=(h,g,bg,screen,delay=900,onReveal)=>{if(revealTimer)clearTimeout(revealTimer);const title=$('#title');title.hidden=true;view.hidden=true;view.className=g?'gate':'';view.innerHTML=h;setBg(bg);currentScreen=screen||bg||'screen';$('#b-back').hidden=false;syncAmbient();revealTimer=setTimeout(()=>{view.hidden=false;revealTimer=null;view.querySelector('input:not([disabled])')?.focus();if(onReveal)onReveal()},delay)};
const esc=s=>s.replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const goTitle=()=>{if(revealTimer)clearTimeout(revealTimer);if(E?.iv)clearInterval(E.iv);if(E?.advanceTimer)clearTimeout(E.advanceTimer);E=null;B=null;view.hidden=true;const title=$('#title');title.hidden=false;title.style.visibility='hidden';$('#b-back').hidden=true;currentScreen='title';setBg('menu');syncAmbient();revealTimer=setTimeout(()=>{title.style.visibility='';revealTimer=null},900)};
const modalOpen=h=>{modal.hidden=false;modal.innerHTML=`<div class="box">${h}<button class="btn" onclick="modal.hidden=true">Close</button></div>`};
function handleBack(){
 if((currentScreen.startsWith('room')&&E)||(currentScreen==='maze'&&B)){confirmLeaveGame();return}
 if(currentScreen==='name')return goTitle();
 if(currentScreen==='class')return askName();
 if(currentScreen==='board')return askClass();
 if(currentScreen==='leaderboard')return goTitle();
 return partBoard();
}
function confirmLeaveGame(){
 if(E?.iv){clearInterval(E.iv);E.iv=null;E.pausedForBack=true}
 if(E&&!E.iv&&currentScreen.startsWith('room')&&revealTimer){clearTimeout(revealTimer);revealTimer=null;E.pausedReveal=true}
 if(B?.spinTimer){clearTimeout(B.spinTimer);B.spinTimer=null;B.pausedSpin=true}
 modal.hidden=false;
 modal.innerHTML=`<div class="box"><h2>Leave this challenge?</h2><p>Your progress in this run will be lost. Continue to the parts board?</p><div class="row"><button class="btn ghost" onclick="stayInGame()">Stay in Game</button><button class="btn" onclick="leaveGameToBoard()">Continue</button></div></div>`;
}
function stayInGame(){modal.hidden=true;if(E?.pausedReveal){E.pausedReveal=false;room();return}if(E?.pausedForBack){E.pausedForBack=false;E.iv=setInterval(()=>{E.tl--;tick();if(E.tl<=0)lose()},1000)}if(B?.pausedSpin){B.pausedSpin=false;resumeSpin()}}
function leaveGameToBoard(){if(E?.iv)clearInterval(E.iv);if(E?.advanceTimer)clearTimeout(E.advanceTimer);if(B?.spinTimer)clearTimeout(B.spinTimer);E=null;B=null;modal.hidden=true;partBoard()}

const R=[["The Old Gate",[["The rusted lock reads: 7 × 8 = ?",56,"7 × 8 = 7 × 10 − 7 × 2."],["The rusted lock reads: 6 × 9 = ?",54,"6 × 9 = 6 × 10 − 6."]]],
["The Cellar",[["Barrel code: 144 ÷ 12 + 15 = ?",27,"Divide first, then add."],["Barrel code: 132 ÷ 12 + 18 = ?",29,"Divide first, then add."]]],
["The Clock Tower",[["The hands stop at x, where 3x + 7 = 40. x = ?",11,"Subtract 7, then divide by 3."],["The hands stop at x, where 4x + 5 = 37. x = ?",8,"Subtract 5, then divide by 4."]]],
["The Chapel",[["Triangle window: base 14, height 9. What is its area?",63,"Area = ½ × base × height."],["Triangle window: base 12, height 11. What is its area?",66,"Area = ½ × base × height."]]]];
/* CBSE-aligned, grade-specific maze cards. Card shape: level, topic, prompt, answer, explanation. */
const QUESTION_BANK={
1:[
 ["Class 1","Addition","A basket has 6 mangoes. Add 3 more. How many mangoes?",9,"6 and 3 make 9."],
 ["Class 1","Subtraction","There are 8 birds. 2 fly away. How many remain?",6,"8 − 2 = 6."],
 ["Class 1","Counting","What number comes after 14?",15,"Count one more: 14, 15."],
 ["Class 1","Shapes","How many sides does a triangle have?",3,"A triangle has 3 sides."],
 ["Class 1","Subtraction","What is 10 − 4?",6,"10 − 4 = 6."],
 ["Class 1","Counting","How many tens are in 30?",3,"30 has 3 tens."],
 ["Class 1","Addition","What is 5 + 5?",10,"5 + 5 = 10."],
 ["Class 1","Patterns","What number comes next: 2, 4, 6, __?",8,"The pattern adds 2 each time."]],
2:[
 ["Class 2","Place value","What is the value of the 4 in  forty-two (42)?",40,"The 4 is in the tens place, so its value is 40."],
 ["Class 2","Addition","What is 28 + 15?",43,"28 + 10 = 38, then add 5: 43."],
 ["Class 2","Subtraction","What is 54 − 27?",27,"54 − 20 = 34; 34 − 7 = 27."],
 ["Class 2","Multiplication","There are 4 bags with 5 marbles each. How many marbles?",20,"4 groups of 5 make 20."],
 ["Class 2","Place value","What is 300 + 40 + 7?",347,"Combine the hundreds, tens and ones."],
 ["Class 2","Division","Share 24 oranges among 6 baskets equally. How many in each?",4,"24 ÷ 6 = 4."],
 ["Class 2","Measurement","How many days are in 2 weeks?",14,"2 × 7 = 14 days."],
 ["Class 2","Addition","What is 46 + 23?",69,"40 + 20 = 60 and 6 + 3 = 9."]],
3:[
 ["Class 3","Multiplication","What is 7 × 8?",56,"Seven groups of eight make 56."],
 ["Class 3","Division","Share 36 pencils equally among 4 students. How many each?",9,"36 ÷ 4 = 9."],
 ["Class 3","Fractions","A pizza is cut into 4 equal pieces. How many pieces are one quarter?",1,"One quarter means one of the four equal pieces."],
 ["Class 3","Measurement","How many centimetres are in 2 metres?",200,"1 metre = 100 centimetres, so 2 metres = 200."],
 ["Class 3","Multiplication","What is 9 × 6?",54,"Nine groups of six make 54."],
 ["Class 3","Division","What is 48 ÷ 6?",8,"6 × 8 = 48."],
 ["Class 3","Fractions","How many halves make one whole?",2,"Two halves make one whole."],
 ["Class 3","Time","How many minutes are in 2 hours?",120,"2 × 60 = 120 minutes."]],
4:[
 ["Class 4","Multiplication","What is 24 × 6?",144,"20 × 6 + 4 × 6 = 120 + 24 = 144."],
 ["Class 4","Division","What is 168 ÷ 7?",24,"7 × 24 = 168."],
 ["Class 4","Fractions","A ribbon is 12 metres long. How many metres is half?",6,"Half of 12 is 12 ÷ 2 = 6."],
 ["Class 4","Perimeter","A square has side 5 cm. What is its perimeter in cm?",20,"Perimeter = 4 × 5 = 20 cm."],
 ["Class 4","Factors","What is the smallest common multiple of 4 and 6?",12,"12 is the first number divisible by both 4 and 6."],
 ["Class 4","Fractions","What is 1/4 of 36?",9,"36 ÷ 4 = 9."],
 ["Class 4","Area","A square has side 7 cm. What is its area?",49,"Area = 7 × 7 = 49 cm²."],
 ["Class 4","Division","What is 225 ÷ 5?",45,"5 × 45 = 225."]],
5:[
 ["Class 5","Large numbers","What is 3,450 + 2,175?",5625,"Add by place value: 3,450 + 2,175 = 5,625."],
 ["Class 5","Fractions","What is 3/5 of 40?",24,"40 ÷ 5 = 8, then 8 × 3 = 24."],
 ["Class 5","Decimals","What is 2.5 + 1.75?",4.25,"2.50 + 1.75 = 4.25."],
 ["Class 5","Area","A rectangle is 8 cm long and 3 cm wide. What is its area in cm²?",24,"Area = length × width = 8 × 3 = 24."],
 ["Class 5","Factors","What is the greatest common factor of 18 and 24?",6,"The greatest number dividing both 18 and 24 is 6."],
 ["Class 5","Fractions","What is 2/3 of 30?",20,"30 ÷ 3 × 2 = 20."],
 ["Class 5","Volume","A cuboid is 3 cm × 2 cm × 4 cm. What is its volume?",24,"Volume = 3 × 2 × 4 = 24 cm³."],
 ["Class 5","Percent","What is 10% of 250?",25,"10% means one tenth: 250 ÷ 10 = 25."]],
6:[
 ["Class 6","Integers","What is −4 + 9?",5,"Starting at −4 and moving 9 steps right gives 5."],
 ["Class 6","Fractions","What is 2/3 of 27?",18,"27 ÷ 3 = 9, and 9 × 2 = 18."],
 ["Class 6","Algebra","If x + 8 = 19, what is x?",11,"Subtract 8 from both sides: x = 11."],
 ["Class 6","Ratio","The ratio is 2:3 and the first quantity is 10. What is the second?",15,"The scale factor is 5, so 3 × 5 = 15."],
 ["Class 6","Integers","What is −7 + 12?",5,"Move 12 places right from −7 to get 5."],
 ["Class 6","Decimals","What is 3.6 + 2.4?",6,"Add tenths and whole numbers: 3.6 + 2.4 = 6."],
 ["Class 6","Algebra","If 4a = 36, what is a?",9,"Divide both sides by 4."],
 ["Class 6","Geometry","How many degrees are in a right angle?",90,"A right angle measures 90°."]],
7:[
 ["Class 7","Rational numbers","What is 3/4 + 1/2? Give the numerator over 4.",5,"1/2 = 2/4, so 3/4 + 2/4 = 5/4; enter 5."],
 ["Class 7","Simple equations","Solve 3x + 5 = 26. What is x?",7,"3x = 21, so x = 7."],
 ["Class 7","Percentages","What is 20% of 150?",30,"10% is 15, so 20% is 30."],
 ["Class 7","Perimeter","A rectangle is 9 cm by 4 cm. What is its perimeter?",26,"2 × (9 + 4) = 26 cm."],
 ["Class 7","Integers","What is (−6) × (−4)?",24,"The product of two negative numbers is positive."],
 ["Class 7","Fractions","What is 5/6 − 1/3? Give the numerator over 6.",3,"1/3 = 2/6, so 5/6 − 2/6 = 3/6; enter 3."],
 ["Class 7","Algebra","Simplify 4a + 3a − 2a. What is the coefficient of a?",5,"Combine like terms: (4+3−2)a = 5a."],
 ["Class 7","Percentage change","A ₹200 item is discounted by 10%. What is the discount in rupees?",20,"10% of 200 is 20."]],
8:[
 ["Class 8","Linear equations","Solve 5x − 7 = 28. What is x?",7,"5x = 35, so x = 7."],
 ["Class 8","Squares","What is 17²?",289,"17 × 17 = 289."],
 ["Class 8","Cubes","What is the cube of 4?",64,"4³ = 4 × 4 × 4 = 64."],
 ["Class 8","Direct proportion","If 3 notebooks cost ₹45, what do 5 cost at the same rate?",75,"One costs ₹15, so five cost ₹75."],
 ["Class 8","Exponents","What is 2⁵?",32,"2 × 2 × 2 × 2 × 2 = 32."],
 ["Class 8","Factorisation","What is the common factor of 12x + 18? Enter the greatest numerical factor.",6,"The greatest common factor of 12 and 18 is 6."],
 ["Class 8","Mensuration","A cube has side 3 cm. What is its volume in cm³?",27,"Volume = 3³ = 27 cm³."],
 ["Class 8","Percentages","What is 15% of 200?",30,"10% is 20 and 5% is 10, total 30."]],
9:[
 ["Class 9","Polynomials","For p(x)=x²−3x+2, what is p(3)?",2,"p(3)=9−9+2=2."],
 ["Class 9","Linear equations","If x + y = 10 and x − y = 2, what is x?",6,"Add the equations: 2x = 12, so x = 6."],
 ["Class 9","Heron's formula","A triangle has sides 3, 4, 5. What is its area?",6,"Semiperimeter is 6; Heron's formula gives √(6×3×2×1)=6."],
 ["Class 9","Statistics","The numbers are 2, 4, 6, 8. What is their mean?",5,"(2+4+6+8) ÷ 4 = 5."],
 ["Class 9","Number systems","What is the value of √81?",9,"9² = 81, so √81 = 9."],
 ["Class 9","Coordinate geometry","What is the x-coordinate of point (−3, 5)?",-3,"The first coordinate is x, so x = −3."],
 ["Class 9","Surface area","A cube has edge 2 cm. What is its total surface area?",24,"6a² = 6 × 4 = 24 cm²."],
 ["Class 9","Probability","A bag has 3 red and 2 blue balls. How many balls are not blue?",3,"The non-blue balls are the 3 red balls."]],
10:[
 ["Class 10","Quadratic equations","What is the positive solution of x²−9=0?",3,"x²=9, so x=±3; the positive solution is 3."],
 ["Class 10","Trigonometry","If sin θ = 3/5 for an acute angle, what is cos θ in fifths?",4,"Using sin²θ+cos²θ=1 gives cos θ=4/5; enter the numerator 4."],
 ["Class 10","Arithmetic progressions","An AP starts 5, 8, 11, ... What is its 10th term?",32,"a₁₀=5+(10−1)×3=32."],
 ["Class 10","Probability","A fair die is rolled. How many outcomes are not greater than 2?",2,"The outcomes are 1 and 2, so there are 2."],
 ["Class 10","Pair of linear equations","If x + y = 9 and x − y = 3, what is x?",6,"Adding gives 2x = 12, so x = 6."],
 ["Class 10","Coordinate geometry","What is the distance between (0,0) and (6,8)?",10,"Distance = √(6²+8²)=√100=10."],
 ["Class 10","Circles","A circle has radius 7 cm. Using π=22/7, what is its circumference?",44,"2πr = 2×22/7×7 = 44 cm."],
 ["Class 10","Trigonometry","If tan θ = 3/4 in a right triangle, what is the hypotenuse when the legs are 3 and 4?",5,"By Pythagoras, √(3²+4²)=5."]],
11:[
 ["Class 11","Sets","If A={1,2,3} and B={3,4}, how many elements are in A∪B?",4,"A∪B={1,2,3,4}, which has 4 elements."],
 ["Class 11","Trigonometry","What is sin²30° + cos²30°?",1,"The identity sin²θ + cos²θ = 1 holds for every angle."],
 ["Class 11","Sequences","An arithmetic sequence has first term 4 and common difference 3. What is its 8th term?",25,"a₈=4+7×3=25."],
 ["Class 11","Permutations","In how many ways can 3 distinct books be arranged?",6,"3! = 3×2×1 = 6."],
 ["Class 11","Complex numbers","What is i²?",-1,"By definition, i² = −1."],
 ["Class 11","Limits","What is lim x→2 of (x+3)?",5,"Substitute x=2: 2+3=5."],
 ["Class 11","Binomial theorem","What is the coefficient of x in (1+x)⁴?",4,"The x term is ⁴C₁x = 4x."],
 ["Class 11","Conic sections","What is the radius of x²+y²=25?",5,"A circle has equation x²+y²=r², so r=5."]],
12:[
 ["Class 12","Differentiation","If f(x)=x³, what is f′(2)?",12,"f′(x)=3x², so f′(2)=3×4=12."],
 ["Class 12","Matrices","What is the determinant of [[2,1],[3,4]]?",5,"The determinant is 2×4−1×3=5."],
 ["Class 12","Probability","A fair coin is tossed 3 times. How many possible outcomes are there?",8,"There are 2 choices each time: 2³=8."],
 ["Class 12","Vectors","What is the magnitude of vector (3,4,0)?",5,"Magnitude = √(3²+4²+0²)=5."],
 ["Class 12","Integration","What is ∫ 2x dx from 0 to 3?",9,"The antiderivative is x²; 3²−0²=9."],
 ["Class 12","Determinants","What is the determinant of [[1,2],[3,5]]?",-1,"1×5−2×3 = −1."],
 ["Class 12","Probability","A fair die is rolled. What is the probability numerator for an even result?",3,"Even results are 2, 4 and 6: 3 favourable outcomes."],
 ["Class 12","Differentiation","If y=5x², what is dy/dx at x=2?",20,"dy/dx=10x, so at x=2 it is 20."]]
};
/* Add three variants for each of four class-appropriate skills to reach 20 cards per grade. */
const EXTRA_QUESTION_TEMPLATES={
1:[
 k=>["Class 1","Addition",`${4+k} + ${2+k} = ?`,6+2*k,`${4+k} + ${2+k} = ${6+2*k}.`],
 k=>["Class 1","Subtraction",`${10+k} − ${2+k} = ?`,8,`${10+k} − ${2+k} = 8.`],
 k=>["Class 1","Counting",`What number comes after ${19+k}?`,20+k,`Count one more: ${20+k}.`],
 k=>["Class 1","Groups",`${2+k} groups of 2 make how many?`,4+2*k,`${2+k} × 2 = ${4+2*k}.`]],
2:[
 k=>["Class 2","Addition",`${30+2*k} + ${11+k} = ?`,41+3*k,`${30+2*k} + ${11+k} = ${41+3*k}.`],
 k=>["Class 2","Subtraction",`${60+2*k} − ${20+k} = ?`,40+k,`${60+2*k} − ${20+k} = ${40+k}.`],
 k=>["Class 2","Multiplication",`${3+k} groups of 4 make how many?`,(3+k)*4,`${3+k} × 4 = ${(3+k)*4}.`],
 k=>["Class 2","Measurement",`How many centimetres are in ${3+k} metres?`,(3+k)*100,`${3+k} × 100 = ${(3+k)*100} cm.`]],
3:[
 k=>["Class 3","Multiplication",`What is ${4+k} × 7?`,(4+k)*7,`${4+k} groups of 7 = ${(4+k)*7}.`],
 k=>["Class 3","Division",`What is ${(10+k)*6} ÷ 6?`,10+k,`6 × ${10+k} = ${(10+k)*6}.`],
 k=>["Class 3","Fractions",`A shape has ${4+2*k} equal parts. How many parts is one half?`,2+k,`Half of ${4+2*k} equal parts is ${2+k}.`],
 k=>["Class 3","Measurement",`How many millimetres are in ${2+k} centimetres?`,(2+k)*10,`1 cm = 10 mm, so the answer is ${(2+k)*10}.`]],
4:[
 k=>["Class 4","Multiplication",`What is ${21+k} × 4?`,(21+k)*4,`${21+k} × 4 = ${(21+k)*4}.`],
 k=>["Class 4","Division",`What is ${(30+k*3)*5} ÷ 5?`,30+k*3,`Divide by 5 to get ${30+k*3}.`],
 k=>["Class 4","Fractions",`What is 1/4 of ${(12+k)*4}?`,12+k,`${(12+k)*4} ÷ 4 = ${12+k}.`],
 k=>["Class 4","Perimeter",`A rectangle is ${4+k} cm by 3 cm. What is its perimeter?`,14+2*k,`2 × (${4+k} + 3) = ${14+2*k} cm.`]],
5:[
 k=>["Class 5","Factors",`What is the least common multiple of ${2+k} and ${4+2*k}?`,4+2*k,`${4+2*k} is a multiple of both numbers.`],
 k=>["Class 5","Fractions",`What is 3/4 of ${(8+k)*4}?`,(8+k)*3,`Divide by 4, then multiply by 3: ${(8+k)*3}.`],
 k=>["Class 5","Decimals",`What is ${1+k}.5 + 2.5?`,4+k,`${1+k}.5 + 2.5 = ${4+k}.0.`],
 k=>["Class 5","Area",`A rectangle is ${5+k} cm by 4 cm. What is its area?`,(5+k)*4,`${5+k} × 4 = ${(5+k)*4} cm².`]],
6:[
 k=>["Class 6","Integers",`What is ${-10-k} + ${15+k}?`,5,`The sum is ${-10-k+15+k} = 5.`],
 k=>["Class 6","Fractions",`What is 3/5 of ${(4+k)*5}?`,(4+k)*3,`Divide by 5, then multiply by 3: ${(4+k)*3}.`],
 k=>["Class 6","Algebra",`If x + ${5+k} = ${15+2*k}, what is x?`,10+k,`Subtract ${5+k}: x = ${10+k}.`],
 k=>["Class 6","Ratio",`The ratio is 2:3. If the first amount is ${4+k*2}, what is the second?`,6+k*3,`The scale factor is ${2+k}; the second amount is 3 × ${2+k}.`]],
7:[
 k=>["Class 7","Integers",`What is (−${2+k}) × (−3)?`,(2+k)*3,`A negative times a negative is positive: ${(2+k)*3}.`],
 k=>["Class 7","Equations",`Solve 2x + ${3+k} = ${15+3*k}. What is x?`,6+k,`2x = ${12+2*k}, so x = ${6+k}.`],
 k=>["Class 7","Percentages","What is 10% of "+(120+k*20)+"?",12+k*2,`Divide by 10: ${12+k*2}.`],
 k=>["Class 7","Algebra",`Simplify ${2+k}a + ${3+k}a. What is the coefficient of a?`,5+2*k,`Add the coefficients: ${2+k} + ${3+k} = ${5+2*k}.`]],
8:[
 k=>["Class 8","Exponents",`What is ${2+k}²?`,(2+k)**2,`${2+k} × ${2+k} = ${(2+k)**2}.`],
 k=>["Class 8","Linear equations",`Solve 3x − ${3+k} = ${12+2*k}. What is x?`,5+k,`3x = ${15+3*k}; x = ${5+k}.`],
 k=>["Class 8","Factorisation",`What is the greatest common factor of ${12+2*k} and ${18+3*k}?`,6+ k,`Both numbers are ${6+k} times consecutive factors 2 and 3.`],
 k=>["Class 8","Percentages",`What is 25% of ${(20+k*4)*4}?`,20+k*4,`25% is one quarter: ${(20+k*4)*4} ÷ 4 = ${20+k*4}.`]],
9:[
 k=>["Class 9","Polynomials",`For p(x)=x²+${k+1}, what is p(${k+2})?`,(k+2)**2+k+1,`Substitute: ${(k+2)**2} + ${k+1} = ${(k+2)**2+k+1}.`],
 k=>["Class 9","Linear equations",`If x+y=${10+2*k} and x−y=2, what is x?`,7+k,`Add the equations: 2x=${12+2*k}, so x=${7+k}.`],
 k=>["Class 9","Statistics",`Find the mean of ${k+1}, ${k+3}, ${k+5}.`,k+3,`The middle value is ${k+3}, so the mean is ${k+3}.`],
 k=>["Class 9","Geometry",`Two angles of a triangle are ${30+5*k}° and 60°. What is the third angle?`,90-5*k,`Triangle angles total 180°: 180−${30+5*k}−60=${90-5*k}°.`]],
10:[
 k=>["Class 10","Quadratics",`What is the positive root of x² − ${(4+k)**2} = 0?`,4+k,`The positive square root of ${(4+k)**2} is ${4+k}.`],
 k=>["Class 10","Arithmetic progressions",`An AP has first term ${2+k} and common difference 3. What is its 6th term?`,18+k,`a₆ = ${2+k} + 5×3 = ${18+k}.`],
 k=>["Class 10","Coordinate geometry",`Find the distance from (0,0) to (${3*(k+1)},${4*(k+1)}).`,5*(k+1),`The points are scaled 3–4–5 triangles, so the distance is ${5*(k+1)}.`],
 k=>["Class 10","Trigonometry",`If sin θ = ${3*(k+1)}/${5*(k+1)} for an acute angle, what is the denominator of cos θ?`,5*(k+1),`The ratio simplifies to 3/5, so cos θ has denominator ${5*(k+1)} in this equivalent triangle ratio.`]],
11:[
 k=>["Class 11","Sequences",`An AP starts at ${2+k} with common difference 4. What is its 7th term?`,26+k,`a₇=${2+k}+6×4=${26+k}.`],
 k=>["Class 11","Permutations",`How many ways can ${3+k} distinct objects be arranged?`,[24,120,720][k-1],`${3+k}! = ${[24,120,720][k-1]}.`],
 k=>["Class 11","Limits",`What is lim x→${2+k} of (2x+1)?`,5+2*k,`Substitute x=${2+k}: 2×${2+k}+1=${5+2*k}.`],
 k=>["Class 11","Binomial theorem",`What is the coefficient of x in (1+x)${6+k}?`,6+k,`The coefficient of x in (1+x)^n is n, so it is ${6+k}.`]],
12:[
 k=>["Class 12","Differentiation",`If f(x)=x², what is f′(${2+k})?`,4+2*k,`f′(x)=2x, so f′(${2+k})=${4+2*k}.`],
 k=>["Class 12","Matrices",`What is the determinant of [[${2+k},1],[1,2]]?`,3+2*k,`${2+k}×2−1×1=${3+2*k}.`],
 k=>["Class 12","Integration",`What is ∫ 2x dx from 0 to ${3+k}?`,(3+k)**2,`The antiderivative is x²; ${3+k}²=${(3+k)**2}.`],
 k=>["Class 12","Vectors",`What is the magnitude of vector (${3*(k+1)},${4*(k+1)},0)?`,5*(k+1),`Magnitude = √((${3*(k+1)})²+(${4*(k+1)})²) = ${5*(k+1)}.`]]
};
for(let grade=1;grade<=12;grade++){
 const templates=EXTRA_QUESTION_TEMPLATES[grade];
 for(let k=1;k<=3;k++)for(const template of templates)QUESTION_BANK[grade].push(template(k));
}
let C=[],questionRun=[];

let E,B,part1Cleared=false;
let P={name:'Player 1',cls:''};
let currentScreen='title';
$('#b-start').onclick=()=>{part1Cleared=false;askName()};
$('#b-lb').onclick=leaderboard;
$('#b-snd').onclick=function(){sound=!sound;this.textContent=sound?'🔊':'🔇';if(sound){ambientPrimed=true;syncAmbient()}else stopAmbient()};
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
function askName(){show(`<h2>What is your name, traveller?</h2><input id="nm" type="text" maxlength="16" placeholder="Your name" autocomplete="off" onkeydown="if(event.key==='Enter')saveName()"><div class="row"><button class="btn" onclick="saveName()">Next</button></div>`,1,'name')}
function saveName(){const v=$('#nm').value.trim();if(!v){$('#nm').focus();return}P.name=esc(v);askClass()}
function askClass(){show(`<h2>${P.name}, which class are you in?</h2><p class="q">Choose your class to set the maths difficulty.</p><div class="grid">${[1,2,3,4,5,6,7,8,9,10,11,12].map(c=>`<button class="btn" onclick="pickClass('${c}')">${c}</button>`).join('')}</div>`,1,'class')}
function pickClass(c){P.cls=c;partBoard()}
function intro(){partBoard()}
function partBoard(){show(`<h1>Choose a Part</h1><p class="q">Complete each part to unlock the next challenge.</p>
<div class="part-card"><div class="doors" aria-hidden="true"><i>🚪</i><i>🚪</i><i>🚪</i><i>🚪</i></div><h2>${part1Cleared?'✅ Part 1: The Abandoned House':'Part 1: The Abandoned House'}</h2><p>Earn four keys, open the final box, and stop the buzzing.</p><button class="btn" onclick="playStory('part1')">${part1Cleared?'Replay Part 1':'Start Part 1'}</button></div>
<div class="part-card ${part1Cleared?'':'locked'}"><div class="doors" aria-hidden="true"><i>🌀</i>${part1Cleared?'':'<i class="lock">🔒</i>'}</div><h2>${part1Cleared?'Part 2: The Maze':'Part 2: The Maze'}</h2><p>${part1Cleared?'Unlocked! Solve questions and spin toward the exit.':'Clear Part 1 to unlock this challenge.'}</p><button class="btn" ${part1Cleared?'onclick="playStory(\'part2\')"':'disabled'}>${part1Cleared?'Start Part 2':'Locked'}</button></div>
`,1,'board')}

/* ---------- Leaderboard ---------- */
const HOW=`<h2>How to play</h2><p><b>Class-based maths:</b> Questions are selected for the class you chose, with topics and difficulty progressing from foundational skills to senior-secondary Maths.</p><p><b>Part 1:</b> Answer each room’s question to earn its key. Each key opens the next key box; the fourth room reveals the controller.</p><p><b>Part 2:</b> Correct answers move forward by your 1–4 spin. Wrong answers move backward by the same spin. Reach the exit to escape.</p>`;
const lbGet=()=>{try{return JSON.parse(localStorage.getItem('mq_lb')||'[]')}catch(e){return[]}};
function saveScore(k,tl){try{const l=lbGet();l.push({n:P.name,c:P.cls,s:k*100+Math.max(tl,0)});l.sort((a,b)=>b.s-a.s);localStorage.setItem('mq_lb',JSON.stringify(l.slice(0,10)))}catch(e){}}
function leaderboard(){const l=lbGet();show(`<h2>🏆 Leaderboard</h2>${l.length?l.map((e,i)=>`<p class="lb"><span>${i+1}. ${e.n} · Class ${e.c}</span><b>${e.s}</b></p>`).join(''):'<p>No scores yet. Be the first!</p>'}<p><small>Score = 100 per key + seconds left</small></p>`,0,'class','leaderboard')}

/* ---------- Part 1: four rooms ---------- */
function startEscape(){if(E?.iv)clearInterval(E.iv);if(E?.advanceTimer)clearTimeout(E.advanceTimer);C=QUESTION_BANK[+P.cls]||QUESTION_BANK[12];const shuffled=shuffle(C.slice());questionRun=shuffled.slice(4);E={r:0,keys:0,tries:0,hint:1,tl:600,qs:shuffled.slice(0,4).map(q=>[q[2],q[3],q[4]])};room()}
const tick=()=>{const t=$('#tm');if(t)t.textContent='⏳ '+Math.floor(Math.max(E.tl,0)/60)+':'+String(Math.max(E.tl,0)%60).padStart(2,'0')};
function room(){E.tries=0;if(E.iv){clearInterval(E.iv);E.iv=null}show(`<div class="hud"><span id="tm"></span><span>🗝️ ${E.keys}/4</span></div><h2>Room ${E.r+1}: ${R[E.r][0]}</h2><p class="q">${E.qs[E.r][0]}</p><p id="fb" class="fb" aria-live="polite"></p><div id="recovery"></div><input id="ans" type="number" inputmode="numeric" onkeydown="if(event.key==='Enter')submitE()"><div class="row"><button class="btn" id="submit-room" onclick="submitE()">Unlock</button><button class="btn ghost" id="hb" onclick="hintE()">Hint (${E.hint}) −30s</button></div>`,0,'room'+(E.r+1),'room'+(E.r+1),2200,()=>{if(!E)return;tick();$('#ans')?.focus();E.iv=setInterval(()=>{if(!E)return;E.tl--;tick();if(E.tl<=0)lose()},1000)})}
const fb=(t,b)=>{const f=$('#fb');f.textContent=t;f.className='fb'+(b?' bad':'')};
function hintE(){if(!E.hint)return;E.hint=0;E.tl-=30;$('#hb').disabled=true;fb('Hint: '+E.qs[E.r][2])}
function submitE(){const i=$('#ans');if(i.value===''||i.disabled)return;const c=E.qs[E.r],v=+i.value;i.value='';
 if(v===c[1]){ok();if(E.tries===2)E.tl-=30;fb('🗝️ Key earned! '+c[2]);nextRoom()}
 else{bad();E.tries++;if(E.tries===1)fb('Not quite. Try once more.',1);else if(E.tries===2)fb('Clue: '+c[2]+' One more attempt.',1);else{E.tl-=45;fb('No key yet. Review the clue, then try this room again. '+c[2]+' (−45 s)',1);i.disabled=true;$('#submit-room').disabled=true;$('#hb').disabled=true;$('#recovery').innerHTML='<button class="btn ghost" onclick="room()">Review clue and retry room</button>'}}}
function nextRoom(){$('#ans').disabled=true;$('#submit-room').disabled=true;$('#hb').disabled=true;E.advanceTimer=setTimeout(()=>{if(!E||E.tl<=0)return;E.keys++;E.r++;E.r===4?transition():room()},1200)}
function lose(){if(!E)return;clearInterval(E.iv);if(E.advanceTimer)clearTimeout(E.advanceTimer);saveScore(E.keys,0);show(`<h1>Time's up</h1><p class="q">The buzzing grows louder… You collected ${E.keys} of 4 keys.</p><div class="row"><button class="btn" onclick="startEscape()">Try Again</button><button class="btn ghost" onclick="partBoard()">Parts Board</button></div>`,1,'house','retry')}
function transition(){clearInterval(E.iv);saveScore(E.keys,E.tl);part1Cleared=true;show(`<h1>Part 1 Cleared!</h1><p class="q">You found the controller and stopped the shrill buzzing. The villagers are safe. Your next challenge is now unlocked.</p><div class="row"><button class="btn" onclick="playStory('part2')">Start Part 2</button><button class="btn ghost" onclick="partBoard()">Parts Board</button></div>`,1,'cleared')}

/* ---------- Part 2: maze ---------- */
function startBoard(){const cls=+P.cls||12;C=QUESTION_BANK[cls]||QUESTION_BANK[12];const mazeDeck=questionRun.length?questionRun.map(card=>C.indexOf(card)):shuffle(C.map((_,i)=>i));questionRun=[];B={p:0,cards:C,deck:mazeDeck,card:null,wheelAngle:0};board()}
function board(msg=''){const first=B.p-4;const cells=Array.from({length:15},(_,j)=>{const i=first+j;const atStart=i===0,atExit=i===14;return `<div class="cell${atExit?' fin':''}${i===B.p?' current':''}">${atStart?'START':atExit?'EXIT':i}<br>${B.p===i?'<span class="tok">🟠</span>':''}</div>`}).join('');const distance=14-B.p;
 show(`<h2>${P.name}'s Maze</h2><p class="maze-progress">${distance} spaces to the exit</p><div class="track">${cells}</div><p class="fb" aria-live="polite">${msg}</p><div id="act"><button class="btn" onclick="drawQuestion()">Get a maths question</button></div>`,0,'maze')}
function drawQuestion(){const pool=B.deck.length?B.deck:(B.deck=shuffle(B.cards.map((_,i)=>i)));B.card=pool.pop();ask()}
function ask(){const c=B.cards[B.card];$('#act').innerHTML=`<div class="card"><small>${c[0]} · ${c[1]}</small><p class="q">${c[2]}</p><input id="ans" type="number" inputmode="decimal" step="any" onkeydown="if(event.key==='Enter')answerB()"><button class="btn" onclick="answerB()">Answer</button></div>`;$('#ans').focus()}
function answerB(){const i=$('#ans');if(i.value===''||i.disabled)return;const c=B.cards[B.card];B.correct=(+i.value===c[3]);i.disabled=true;if(B.correct)ok();else bad();$('#act').innerHTML=`<p class="fb${B.correct?'':' bad'}" aria-live="polite">${B.correct?'✔ Correct!':'✘ Incorrect. The answer was '+c[3]+'.'} ${c[4]}</p><div class="wheel-wrap" role="img" aria-label="Four-section wheel, numbered one to four"><div class="wheel-pointer" aria-hidden="true"></div><div class="wheel" id="wheel" style="transform:rotate(${B.wheelAngle}deg)"><span class="wheel-label">1</span><span class="wheel-label">2</span><span class="wheel-label">3</span><span class="wheel-label">4</span><span class="wheel-hub" aria-hidden="true"></span></div></div><button class="btn" id="spin-button" onclick="spin2()">🎡 Spin the wheel</button>`}
function spin2(){const button=$('#spin-button'),wheel=$('#wheel');if(!button||button.disabled)return;button.disabled=true;const quarterTurns=rnd(4),fullTurns=5+rnd(3);B.wheelAngle+=fullTurns*360+quarterTurns*90;wheel.style.transform=`rotate(${B.wheelAngle}deg)`;B.spinning=true;B.spinTimer=setTimeout(()=>{if(!B)return;B.spinTimer=null;B.spinResult=wheelValue(B.wheelAngle);B.spinning=false;applySpin()},matchMedia('(prefers-reduced-motion: reduce)').matches?180:2900)}
function wheelValue(angle){const quarter=((Math.round((((angle%360)+360)%360)/90))%4);return [1,4,3,2][quarter]}
function applySpin(){if(!B)return;const spaces=B.spinResult||wheelValue(B.wheelAngle);B.p+=(B.correct?1:-1)*spaces;if(B.correct&&B.p>=14)return finish();board(`${B.correct?'Correct · moved forward':'Incorrect · moved backward'} ${spaces} ${spaces===1?'space':'spaces'}.`)}
function resumeSpin(){if(!B?.spinning)return;const wheel=$('#wheel');if(wheel)wheel.style.transform=`rotate(${B.wheelAngle}deg)`;B.spinTimer=setTimeout(()=>{if(!B)return;B.spinTimer=null;B.spinResult=wheelValue(B.wheelAngle);B.spinning=false;applySpin()},2900)}
function finish(){ok();show(`<h1>You escaped, ${P.name}!</h1><p class="q">You reached the maze exit, silenced the buzzing, and helped the village.<br><br>Concepts you practised: multiplication, division, percentages, fractions, algebra, area and powers.</p><div class="row"><button class="btn" onclick="part1Cleared=false;partBoard()">Play Again</button><button class="btn ghost" onclick="partBoard()">Parts Board</button></div>`,1,'escape')}
