const canvas=document.getElementById("canvas");
const ctx=canvas.getContext("2d",{alpha:false});
const video=document.getElementById("source");
const sequence=document.getElementById("sequence");
const progressEl=document.getElementById("progress");
const frameEl=document.getElementById("frame");

const FRAME_COUNT=169;
let target=0;
let displayed=0;
let lastTime=-1;
let seeking=false;
let pendingTime=null;
let ready=false;

function resize(){
  const dpr=Math.min(window.devicePixelRatio||1,2);
  canvas.width=Math.round(innerWidth*dpr);
  canvas.height=Math.round(innerHeight*dpr);
  canvas.style.width=innerWidth+"px";
  canvas.style.height=innerHeight+"px";
  ctx.setTransform(dpr,0,0,dpr,0,0);
  draw();
}

function draw(){
  if(!ready || video.readyState<2) return;
  const vw=innerWidth,vh=innerHeight;
  const scale=Math.max(vw/video.videoWidth,vh/video.videoHeight);
  const w=video.videoWidth*scale,h=video.videoHeight*scale;
  const x=(vw-w)/2,y=(vh-h)/2;
  ctx.fillStyle="#080808";
  ctx.fillRect(0,0,vw,vh);
  ctx.drawImage(video,x,y,w,h);
}

function seek(time){
  if(!ready) return;
  if(seeking){pendingTime=time;return}
  if(Math.abs(video.currentTime-time)<0.008){draw();return}
  seeking=true;
  pendingTime=null;
  video.currentTime=Math.max(0,Math.min(video.duration||0,time));
}

video.addEventListener("loadedmetadata",()=>{
  ready=true;
  resize();
  seek(0);
});

video.addEventListener("seeked",()=>{
  seeking=false;
  draw();
  if(pendingTime!==null){
    const t=pendingTime;
    pendingTime=null;
    seek(t);
  }
});

function updateTarget(){
  const rect=sequence.getBoundingClientRect();
  const travel=Math.max(1,sequence.offsetHeight-innerHeight);
  const p=Math.max(0,Math.min(1,-rect.top/travel));
  target=p*(FRAME_COUNT-1);
  progressEl.style.width=(p*100)+"%";
  frameEl.textContent=String(Math.round(target)+1).padStart(3,"0")+" / "+FRAME_COUNT;
}

function tick(){
  displayed+=(target-displayed)*0.18;
  if(Math.abs(target-displayed)<0.01) displayed=target;
  const duration=video.duration||5.64;
  const t=(displayed/(FRAME_COUNT-1))*duration;
  seek(t);
  requestAnimationFrame(tick);
}

window.addEventListener("scroll",updateTarget,{passive:true});
window.addEventListener("resize",resize);
window.addEventListener("load",()=>{updateTarget();tick()});
resize();
