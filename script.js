const frame=document.getElementById("sequence-frame");
const section=document.getElementById("camera-sequence");
const loading=document.getElementById("loading");
const counter=document.getElementById("counter");
const progress=document.getElementById("progress");

const TOTAL=169;
const cache=new Map();
let current=0,target=0,shown=-1;
let fallbackVideo=null;

function url(i){return "./frames/frame-"+String(i+1).padStart(3,"0")+".jpg";}

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

function showFallback(){
  if(fallbackVideo)return;
  fallbackVideo=document.createElement("video");
  fallbackVideo.src="./DAD11FBC-C257-4ED7-B269-BC67BDB22D2B.MP4";
  fallbackVideo.autoplay=true;
  fallbackVideo.muted=true;
  fallbackVideo.loop=true;
  fallbackVideo.playsInline=true;
  fallbackVideo.setAttribute("playsinline","");
  Object.assign(fallbackVideo.style,{position:"fixed",inset:"0",width:"100vw",height:"100vh",objectFit:"cover",zIndex:"1",background:"#070707"});
  document.body.insertBefore(fallbackVideo,document.body.firstChild);
  frame.style.display="none";
  fallbackVideo.play().catch(()=>{});
}

function hideFallback(){
  if(fallbackVideo){
    fallbackVideo.pause();
    fallbackVideo.remove();
    fallbackVideo=null;
  }
  frame.style.display="block";
}

function show(i){
  i=Math.max(0,Math.min(TOTAL-1,Math.round(i)));
  if(i===shown)return;
  shown=i;
  const src=url(i);
  if(frame.src!==new URL(src,location.href).href) frame.src=src;
  counter.textContent=String(i+1).padStart(3,"0")+" / "+TOTAL;
}

function warm(center){
  for(let d=1;d<=10;d++){
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

frame.addEventListener("load",()=>{ hideFallback(); });
frame.addEventListener("error",showFallback);

(async function(){
  show(0);
  const ok=await load(0);
  if(!ok){
    showFallback();
    scrollUpdate();
    animate();
    return;
  }
  frame.src=url(0);
  warm(0);
  scrollUpdate();
  animate();
})();

addEventListener("resize",scrollUpdate);
addEventListener("scroll",scrollUpdate,{passive:true});