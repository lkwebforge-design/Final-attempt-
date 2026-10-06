const canvas=document.getElementById("sequence");
const ctx=canvas.getContext("2d");
const section=document.getElementById("camera-sequence");
const progress=document.getElementById("progress");
const counter=document.getElementById("counter");
const loading=document.getElementById("loading");

const FRAME_COUNT=169;
const images=[];
let currentFrame=0;
let targetFrame=0;
let loaded=0;

for(let i=0;i<FRAME_COUNT;i++){
  const image=new Image();
  image.decoding="async";
  image.src=`frames/frame-${String(i+1).padStart(3,"0")}.jpg`;
  image.onload=()=>{
    loaded++;
    loading.querySelector("b").textContent=Math.round(loaded/FRAME_COUNT*100)+"%";
    if(loaded===FRAME_COUNT) loading.style.opacity="0";
    drawFrame(currentFrame);
  };
  image.onerror=()=>console.warn("Missing frame:",image.src);
  images.push(image);
}

function resizeCanvas(){
  const dpr=Math.min(window.devicePixelRatio||1,2);
  canvas.width=innerWidth*dpr;
  canvas.height=innerHeight*dpr;
  canvas.style.width="100vw";
  canvas.style.height="100vh";
  ctx.setTransform(dpr,0,0,dpr,0,0);
  drawFrame(currentFrame);
}

function drawFrame(frame){
  const image=images[Math.round(frame)];
  if(!image||!image.complete||!image.naturalWidth)return;

  const vw=innerWidth,vh=innerHeight;
  const scale=Math.max(vw/image.naturalWidth,vh/image.naturalHeight);
  const width=image.naturalWidth*scale;
  const height=image.naturalHeight*scale;
  const x=(vw-width)/2;
  const y=(vh-height)/2;

  ctx.clearRect(0,0,vw,vh);
  ctx.drawImage(image,x,y,width,height);
}

function updateScroll(){
  const rect=section.getBoundingClientRect();
  const scrollable=section.offsetHeight-innerHeight;
  const progressValue=Math.min(1,Math.max(0,-rect.top/scrollable));
  targetFrame=progressValue*(FRAME_COUNT-1);
  progress.style.width=(progressValue*100)+"%";
  counter.textContent=String(Math.round(targetFrame)+1).padStart(3,"0")+" / "+FRAME_COUNT;
}

function animate(){
  currentFrame+=(targetFrame-currentFrame)*0.15;
  if(Math.abs(targetFrame-currentFrame)<0.01)currentFrame=targetFrame;
  drawFrame(currentFrame);
  requestAnimationFrame(animate);
}

addEventListener("scroll",updateScroll,{passive:true});
addEventListener("resize",resizeCanvas);
resizeCanvas();
updateScroll();
animate();
