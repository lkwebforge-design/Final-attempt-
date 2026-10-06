const canvas=document.getElementById("sequence");
const ctx=canvas.getContext("2d");
const section=document.getElementById("camera-sequence");
const loading=document.getElementById("loading");
const counter=document.getElementById("counter");
const progress=document.getElementById("progress");

const TOTAL=169;
const images=new Array(TOTAL);
const loadingFrames=new Map();
let current=0,target=0,last=-1,ready=false;

function resize(){
  const dpr=Math.min(devicePixelRatio||1,2);
  canvas.width=Math.round(innerWidth*dpr);
  canvas.height=Math.round(innerHeight*dpr);
  canvas.style.width="100vw";canvas.style.height="100vh";
  ctx.setTransform(dpr,0,0,dpr,0,0);
  draw(last<0?0:last);
}
function url(i){return "./frames/frame-"+String(i+1).padStart(3,"0")+".jpg";}
function load(i){
  if(i<0||i>=TOTAL||images[i]) return Promise.resolve(!!images[i]);
  if(loadingFrames.has(i)) return loadingFrames.get(i);
  const p=new Promise(resolve=>{
    const im=new Image();
    im.decoding="async";
    im.onload=()=>{images[i]=im;loadingFrames.delete(i);resolve(true);};
    im.onerror=()=>{loadingFrames.delete(i);resolve(false);};
    im.src=url(i);
  });
  loadingFrames.set(i,p);return p;
}
async function warm(center){
  const radius=12;
  const jobs=[];
  for(let d=0;d<=radius;d++){
    if(center-d>=0)jobs.push(load(center-d));
    if(d&&center+d<TOTAL)jobs.push(load(center+d));
  }
  await Promise.all(jobs);
}
function nearest(i){
  if(images[i])return i;
  for(let d=1;d<TOTAL;d++){
    if(i-d>=0&&images[i-d])return i-d;
    if(i+d<TOTAL&&images[i+d])return i+d;
  }
  return -1;
}
function draw(i){
  if(!ready)return;
  const n=nearest(Math.round(i));
  if(n<0||n===last)return;
  const im=images[n],vw=innerWidth,vh=innerHeight;
  const scale=Math.max(vw/im.naturalWidth,vh/im.naturalHeight);
  const w=im.naturalWidth*scale,h=im.naturalHeight*scale;
  ctx.fillStyle="#070707";ctx.fillRect(0,0,vw,vh);
  ctx.drawImage(im,(vw-w)/2,(vh-h)/2,w,h);last=n;
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
  current+=(target-current)*.22;
  if(Math.abs(target-current)<.02)current=target;
  draw(current);
  requestAnimationFrame(animate);
}
(async function(){
  resize();
  loading.firstChild.textContent="LOADING CAMERA ";
  await load(0);
  ready=!!images[0];
  if(!ready){loading.classList.add("error");loading.innerHTML="CAMERA LOAD FAILED — <b>FRAME 001</b>";return;}
  draw(0);loading.querySelector("b").textContent="100%";
  setTimeout(()=>loading.classList.add("done"),300);
  scrollUpdate();animate();
})();
addEventListener("resize",()=>{resize();scrollUpdate();});
addEventListener("scroll",scrollUpdate,{passive:true});
