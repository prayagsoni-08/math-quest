'use strict';

// Each template supplies the numbers players see and a worked solution.
// The audit checks every generated item against a second calculation.
const question = (topic, signs, text, answer, clue, check) => ({topic, signs, text, answer, clue, check});
const combinations = (n,r) => {
  let count=1;
  for(let i=1;i<=r;i++)count=count*(n-i+1)/i;
  return count;
};
const templates = {
  1: [
    (a,b)=>{const x=9+a,y=4+b;return question('Addition',[x,y],'How many stones are marked on the two plaques altogether?',x+y,`Start at ${x} and count on ${y}. The total is ${x+y}.`,()=>Array.from({length:x}).concat(Array.from({length:y})).length);},
    (a,b)=>{const x=19+a,y=5+b;return question('Subtraction',[x,y],'Start at the first number. Take away the second number. What is left?',x-y,`Count back ${y} from ${x} to reach ${x-y}.`,()=>Array.from({length:x}).slice(y).length);},
    (a,b)=>{const x=3+a,y=2+b;return question('Number patterns',[x,x+y],`The pattern starts ${x}, ${x+y}. Add the same number each time. What is the third number?`,x+2*y,`The jump is ${y}. Add it to ${x+y} to reach ${x+2*y}.`,()=>x+y+(x+y-x));},
    (a,b)=>{const x=2+a,y=2+b;return question('Equal groups',[x,y],`There are ${x} bags holding ${y} marbles each. How many marbles are there?`,x*y,`Add ${y} a total of ${x} times to get ${x*y}.`,()=>Array.from({length:x},()=>y).reduce((p,q)=>p+q,0));}
  ],
  2: [
    (a,b)=>{const x=24+3*a,y=12+2*b;return question('Addition',[x,y],'Add the two plaque numbers.',x+y,`Add the tens, then the ones. The total is ${x+y}.`,()=>10*(Math.floor(x/10)+Math.floor(y/10))+x%10+y%10);},
    (a,b)=>{const x=53+3*a,y=19+2*b;return question('Subtraction',[x,y],'Subtract the second plaque number from the first.',x-y,`Subtract ${10*Math.floor(y/10)} first, then subtract ${y%10}. The difference is ${x-y}.`,()=>Array.from({length:x}).slice(0,x-y).length);},
    (a,b)=>{const x=8+a,y=3+b,z=4;return question('Word problems',[x,y],`You have ${x} tokens, find ${y} more, and spend ${z}. How many remain?`,x+y-z,`First add to get ${x+y}, then take away ${z} to get ${x+y-z}.`,()=>Array.from({length:x}).concat(Array.from({length:y})).slice(z).length);},
    (a,b)=>{const x=3+a,y=2+b;return question('Equal shares',[x*y,x],`Share ${x*y} beads equally among ${x} people. How many does each person get?`,y,`${x} groups of ${y} make ${x*y}.`,()=>Array.from({length:x*y}).filter((_,i)=>i%x===0).length);}
  ],
  3: [
    (a,b)=>{const x=12+a,y=3+b;return question('Multiplication',[x,y],'Find the product of the two numbers.',x*y,`Multiply ${x} by ${y} to get ${x*y}.`,()=>Array.from({length:y},()=>x).reduce((p,q)=>p+q,0));},
    (a,b)=>{const x=4+a,y=3+b;return question('Division',[x*y,x],`How many groups of ${x} fit into ${x*y}?`,y,`${x} × ${y} = ${x*y}, so the quotient is ${y}.`,()=>Array.from({length:x*y}).filter((_,i)=>i%x===0).length);},
    (a,b)=>{const x=6+a,y=3+b;return question('Perimeter',[x,y],`A rectangle is ${x} cm by ${y} cm. What is its perimeter in cm?`,2*(x+y),`Add all four sides: ${x} + ${y} + ${x} + ${y} = ${2*(x+y)}.`,()=>[x,x,y,y].reduce((p,q)=>p+q,0));},
    (a,b)=>{const x=13+a,y=9+b;return question('Money',[x,y],`You pay ₹50 for items costing ₹${x} and ₹${y}. How much change do you get, in rupees?`,50-x-y,`The items cost ₹${x+y}. Subtract this from ₹50 to get ₹${50-x-y}.`,()=>Array.from({length:50}).slice(x).slice(y).length);}
  ],
  4: [
    (a,b)=>{const x=14+a,y=5+b;return question('Area',[x,y],`A floor is ${x} m by ${y} m. After ${x} square metres are covered, how many square metres remain?`,x*y-x,`The floor has area ${x*y}. Subtract ${x} to get ${x*y-x}.`,()=>x*(y-1));},
    (a,b)=>{const x=5+a,y=8+b,r=1+(a+b)%(x-1);return question('Remainders',[x*y+r,x],`Divide ${x*y+r} by ${x}. What is the remainder?`,r,`${x} × ${y} = ${x*y}, leaving ${r}.`,()=>(x*y+r)%x);},
    (a,b)=>{const x=2+a,y=11+b;return question('Time',[x,y],`How many minutes are in ${x} hours and ${y} minutes?`,60*x+y,`Each hour is 60 minutes. The total is ${60*x+y} minutes.`,()=>Array.from({length:x},()=>60).reduce((p,q)=>p+q,y));},
    (a,b)=>{const x=4+a,y=6+b;return question('Fractions',[x*y,x],`Find one ${x === 4?'quarter':x===5?'fifth':x===6?'sixth':x===7?'seventh':x===8?'eighth':x===9?'ninth':x===10?'tenth':x===11?'eleventh':'twelfth'} of ${x*y}.`,y,`Divide ${x*y} by ${x} to get ${y}.`,()=>(x*y)/x);}
  ],
  5: [
    (a,b)=>{const x=4+a,y=3+b;return question('Fractions',[4*x,3*y],`Find 3/4 of ${4*x} plus 2/3 of ${3*y}.`,3*x+2*y,`The two parts are ${3*x} and ${2*y}. Their sum is ${3*x+2*y}.`,()=>.75*(4*x)+(2*(3*y))/3);},
    (a,b)=>{const x=8+a,y=3+b,z=4;return question('Volume',[x,y],`A box measures ${x} cm by ${y} cm by ${z} cm. What is its volume in cubic centimetres?`,x*y*z,`Multiply all three dimensions to get ${x*y*z} cm³.`,()=>Array.from({length:z},()=>x*y).reduce((p,q)=>p+q,0));},
    (a,b)=>{const x=12+a,y=2+b;return question('Decimals',[x+.5,y+.25],`Find ${x+.5} − ${y+.25}. Give a decimal answer.`,x-y+.25,`Subtract the whole and fractional parts to get ${x-y+.25}.`,()=>((100*x+50)-(100*y+25))/100);},
    (a,b)=>{const x=17+a,y=12+b;return question('Perimeter',[2*(x+y),x],`A rectangle has perimeter ${2*(x+y)} cm and length ${x} cm. Find its width in cm.`,y,`Half the perimeter is ${x+y}. Subtract the length to get ${y}.`,()=>((2*(x+y))-2*x)/2);}
  ],
  6: [
    (a,b)=>{const x=5+a,y=7+b;return question('Percentages',[20*x,5*y],`Find ${5*y}% of ${20*x}.`,x*y,`Multiply ${20*x} by ${5*y}/100 to get ${x*y}.`,()=>20*x*5*y/100);},
    (a,b)=>{const x=2+a,y=3+b;return question('Integers',[-x,y],`Evaluate (−${x}) − ${y} + ${2*x}.`,x-y,`First combine the two negative terms, then add ${2*x}. The result is ${x-y}.`,()=>2*x-(x+y));},
    (a,b)=>{const x=2+a,y=3+b;return question('Ratios',[x,y],`Two groups are in the ratio ${x}:${y}. There are ${4*(x+y)} students in total. How many students are in the first group?`,4*x,`One ratio part is 4 students, so the first group has ${4*x} students.`,()=>4*(x+y)*x/(x+y));},
    (a,b)=>{const x=2+a,y=3+b;return question('Order of operations',[x,y],`Evaluate ${x} × (${y} + 4) − ${y}.`,x*(y+4)-y,`Do the brackets first, then multiply, then subtract. The result is ${x*(y+4)-y}.`,()=>(x-1)*y+4*x);}
  ],
  7: [
    (a,b)=>{const x=3+a,y=4+b;return question('Linear equations',[x,y],`Solve ${x}x + ${y} = ${x*(y+2)+y}. Enter the value of x.`,y+2,`Subtract ${y}, then divide by ${x} to get x = ${y+2}.`,()=>Array.from({length:30},(_,i)=>i).find(i=>x*i+y===x*(y+2)+y));},
    (a,b)=>{const x=10+a,y=2+b;return question('Simple interest',[100*x,y],`Find the simple interest on ₹${100*x} at ${y}% per year for 3 years, in rupees.`,3*x*y,`Use principal × rate × time ÷ 100 to get ₹${3*x*y}.`,()=>Array.from({length:3},()=>100*x*y/100).reduce((p,q)=>p+q,0));},
    (a,b)=>{const x=7+a,y=6+b;return question('Triangle area',[2*x,y],`A triangle has base ${2*x} cm and perpendicular height ${y} cm. Find its area in cm².`,x*y,`Half of ${2*x} × ${y} is ${x*y} cm².`,()=>2*x*y/2);},
    (a,b)=>{const x=4+a,y=2+b;return question('Mean',[x,y],`Find the mean of ${x}, ${x+y}, ${x+2*y} and ${x+5*y}.`,x+2*y,`Their sum is ${4*x+8*y}. Divide by four to get ${x+2*y}.`,()=>[x,x+y,x+2*y,x+5*y].reduce((p,q)=>p+q,0)/4);}
  ],
  8: [
    (a,b)=>{const x=4+a,y=3+b;return question('Equations',[x,y],`Solve ${x}(t − 2) = ${x-1}t + ${y}. Enter the value of t.`,2*x+y,`Expand and collect the t terms. That leaves t = ${2*x} + ${y} = ${2*x+y}.`,()=>Array.from({length:60},(_,i)=>i).find(i=>x*(i-2)===(x-1)*i+y));},
    (a,b)=>{const x=15+a,y=2+b;return question('Successive discounts',[100*x,5*y],`An item costs ₹${100*x}. Its price falls by ${5*y}%, then rises by 20% of the reduced price. Find the final price in rupees.`,(20-y)*6*x,`The reduced price is ₹${5*x*(20-y)}. Add one fifth of it to get ₹${(20-y)*6*x}.`,()=>Math.round((100*x-5*x*y)*1.2));},
    (a,b)=>{const x=8+a,y=4+b;return question('Trapezium area',[x,x+2*y],`The parallel sides of a trapezium are ${x} cm and ${x+2*y} cm. Its height is 7 cm. Find its area in cm².`,(x+y)*7,`Average the parallel sides, then multiply by 7 to get ${(x+y)*7}.`,()=>7*x+7*y);},
    (a,b)=>{const x=6+a,y=3+b;return question('Exponents',[x,y],`Write (2^${x} × 2^${y}) ÷ 2^3 as 2^n. What is n?`,x+y-3,`Add the powers for multiplication, then subtract 3 for division. n = ${x+y-3}.`,()=>Math.log2(2**x*2**y/8));}
  ],
  9: [
    (a,b)=>{const x=37+2*a,y=42+2*b;return question('Triangle angles',[`${x}°`,`${y}°`],`Two angles of a triangle are ${x}° and ${y}°. Find its exterior angle at the third vertex, in degrees.`,x+y,`The third interior angle is ${180-x-y}°. Its supplementary exterior angle is ${x+y}°.`,()=>180-(180-x-y));},
    (a,b)=>{const x=2+a,y=3+b;return question('Polynomial remainder',[x,y],`Find the remainder when t³ − ${y}t + 4 is divided by (t − ${x}).`,x**3-y*x+4,`Substitute t = ${x} in the polynomial to get ${x**3-y*x+4}.`,()=>[1,0,-y,4].reduce((acc,k)=>acc*x+k,0));},
    (a,b)=>{const x=2+a,y=2+b;return question('Heron’s formula',[3*x,4*x],`A triangle has sides ${3*x}, ${4*x}, and ${5*x} cm. How much greater is its area in cm² than that of a rectangle with area ${y} cm²?`,6*x*x-y,`Heron’s formula gives area ${6*x*x} cm². Subtract ${y} to get ${6*x*x-y}.`,()=>Math.sqrt((6*x)*(3*x)*(2*x)*x)-y);},
    (a,b)=>{const x=2+a,y=3+b;return question('Linear equations',[x,y],`The point (${x}, ${y}) lies on 3x + ky = ${3*x+y*(x+2)}. Find k.`,x+2,`Substitute x and y, subtract ${3*x} and divide by ${y}. k = ${x+2}.`,()=>((3*x+y*(x+2))-3*x)/y);}
  ],
  10: [
    (a,b)=>{const x=2+a,y=12+b;return question('Quadratics',[x+y,x*y],`Find the larger root of t² − ${x+y}t + ${x*y} = 0.`,y,`Factor as (t − ${x})(t − ${y}). The larger root is ${y}.`,()=>((x+y)+Math.sqrt((x+y)**2-4*x*y))/2);},
    (a,b)=>{const x=3+a,y=2+b;return question('Arithmetic progressions',[x,y],`An AP starts at ${x} and has common difference ${y}. Find the sum of the first 12 terms.`,6*(2*x+11*y),`The last term is ${x+11*y}. Multiply the average of first and last by 12 to get ${6*(2*x+11*y)}.`,()=>Array.from({length:12},(_,i)=>x+i*y).reduce((p,q)=>p+q,0));},
    (a,b)=>{const x=12+a,y=2+b;return question('Coordinate geometry',[x,x+3*y],`Point P divides A(${x}, 2) to B(${x+3*y}, 8) internally in the ratio 2:1. What is the x-coordinate of P?`,x+2*y,`P is two thirds of the way from A to B, so its x-coordinate is ${x+2*y}.`,()=>(x+2*(x+3*y))/3);},
    (a,b)=>{const x=2+a,y=3+b;return question('Trigonometry',[3*x,4*x],`In a right triangle, opposite and adjacent sides to θ are ${3*x} and ${4*x}. Find ${5*y} × cos θ.`,4*y,`The hypotenuse is ${5*x}, so cos θ = 4/5 and the product is ${4*y}.`,()=>5*y*4*x/Math.hypot(3*x,4*x));}
  ],
  11: [
    (a,b)=>{const n=11+a,r=2+b;return question('Combinations',[n,r],`How many ways can you choose ${r} of ${n} distinct items if one particular item must be included?`,combinations(n-1,r-1),`Choose the remaining ${r-1} from ${n-1}, giving ${combinations(n-1,r-1)} selections.`,()=>{const count=(left,k)=>k===0?1:left<k?0:count(left-1,k-1)+count(left-1,k);return count(n-1,r-1);});},
    (a,b)=>{const x=2+a,y=1+b;return question('Binomial theorem',[x,y],`Find the coefficient of t² in (1 + ${y}t)^${x+2}.`,(x+2)*(x+1)*y*y/2,`Choose two of the ${x+2} factors to supply ${y}t. The coefficient is ${(x+2)*(x+1)*y*y/2}.`,()=>combinations(x+2,2)*y**2);},
    (a,b)=>{const x=2+a,y=3+b;return question('Limits',[x,y],`Find lim as t → ${x} of (t² − ${x*x})/(t − ${x}) + ${y}.`,2*x+y,`Cancel the common factor to leave t + ${x} + ${y}. The limit is ${2*x+y}.`,()=>Math.round(((x+.00001)**2-x*x)/.00001+y));},
    (a,b)=>{const x=2+a,y=3+b;return question('Geometric progressions',[x,y],`Find the sum of the first four terms of a GP with first term ${x} and common ratio ${y}.`,x*(y**4-1)/(y-1),`Use a(r⁴ − 1)/(r − 1) to get ${x*(y**4-1)/(y-1)}.`,()=>[x,x*y,x*y*y,x*y*y*y].reduce((p,q)=>p+q,0));}
  ],
  12: [
    (a,b)=>{const x=2+a,y=3+b;return question('Differentiation',[x,y],`If f(t) = ${x}t³ − 2t², find f′(${y}).`,3*x*y*y-4*y,`Differentiate to get 3 × ${x}t² − 4t, then substitute ${y}. The result is ${3*x*y*y-4*y}.`,()=>Math.round((x*(y+.00001)**3-2*(y+.00001)**2-x*(y-.00001)**3+2*(y-.00001)**2)/.00002));},
    (a,b)=>{const x=2+a,y=3+b;return question('Determinants',[x,y],`Find the determinant of the matrix with rows [${x}, 2, 0], [1, ${y}, 3], and [0, 2, 4].`,x*(4*y-6)-8,`Expand along the first row to get ${x}(4 × ${y} − 6) − 8 = ${x*(4*y-6)-8}.`,()=>4*x*(y-2)+2*x-8);},
    (a,b)=>{const x=1+a,y=3+b;return question('Integration',[x,y],`Find the definite integral of (3t² + 2t) from ${x} to ${x+y}.`,(x+y)**3+(x+y)**2-x**3-x*x,`Evaluate t³ + t² at the upper limit and subtract its value at the lower limit. The result is ${(x+y)**3+(x+y)**2-x**3-x*x}.`,()=>y*(3*x*x+3*x*y+y*y+2*x+y));},
    (a,b)=>{const x=2+a,y=3+b;return question('Vectors',[x,y],`Find the dot product of (${x}, −2, ${y}) and (3, ${y}, −1).`,3*x-3*y,`Multiply corresponding components and add: ${3*x} − ${2*y} − ${y} = ${3*x-3*y}.`,()=>[x,-2,y].map((k,i)=>k*[3,y,-1][i]).reduce((p,q)=>p+q,0));}
  ]
};

const QUESTION_BANK = Object.fromEntries(Object.entries(templates).map(([grade,types])=>{
  const cards=[];
  const fingerprints=new Set();
  for(const [family,build] of types.entries()){
    for(let a=0;a<9;a++){
      for(let b=0;b<9;b++){
        const card=build(a,b);
        const fingerprint=JSON.stringify([card.text,card.signs]);
        if(fingerprints.has(fingerprint))continue;
        fingerprints.add(fingerprint);
        cards.push({...card,id:`${grade}-${family}-${a}-${b}`,fingerprint});
      }
    }
  }
  return [grade,cards];
}));
