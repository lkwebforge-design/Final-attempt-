const frame=document.getElementById("sequence-frame");
const section=document.getElementById("camera-sequence");
const counter=document.getElementById("counter");
const progress=document.getElementById("progress");

const TOTAL=169;
const cache=new Map();
let current=0,target=0,shown=-1;

function url(i){return "/Final-attempt-/frames/frame-"+String(i+1).padStart(3,"0")+".jpg?v=7";}

function load(i){
  if(i<0||i>=TOTAL)return Promise.resolve(false);
  if(cache.has(i))return cache.get(i);
  const p=new Promise(resolve=>{
    const im=new Image();
    im.onload=()=>resolve(true);
    im.onerror=()=>resolve(false);
    im.src=url(i);
  });
  cache.set(i,p);
  return p;
}

function show(i){
  i=Math.max(0,Math.min(TOTAL-1,Math.round(i)));
  if(i===shown)return;
  shown=i;
  frame.src=url(i);
  counter.textContent=String(i+1).padStart(3,"0")+" / "+TOTAL;
}

function warm(center){
  for(let d=1;d<=12;d++){
    if(center-d>=0)load(center-d);
    if(center+d<TOTAL)load(center+d);
  }
}

function scrollUpdate(){
  const rect=section.getBoundingClientRect();
  const range=Math.max(1,section.offsetHeight-innerHeight);
  const p=Math.max(0,Math.min(1,-rect.top/range));
  target=p*(TOTAL-1);
  progress.style.width=(p*100)+"%";
  counter.textContent=String(Math.round(target)+1).padStart(3,"0")+" / "+TOTAL;
  warm(Math.round(target));
}

function animate(){
  current+=(target-current)*.24;
  if(Math.abs(target-current)<.02)current=target;
  show(current);
  requestAnimationFrame(animate);
}

frame.addEventListener("error",()=>{
  counter.textContent="FRAME ERROR";
});

scrollUpdate();
animate();
addEventListener("resize",scrollUpdate);
addEventListener("scroll",scrollUpdate,{passive:true});