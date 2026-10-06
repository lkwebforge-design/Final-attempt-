const video=document.getElementById("camera-video");
const section=document.getElementById("camera-sequence");
const counter=document.getElementById("counter");
const progress=document.getElementById("progress");

let duration=0;
let targetTime=0;
let currentTime=0;
let ready=false;

video.addEventListener("loadedmetadata",()=>{
  duration=video.duration||0;
  ready=Number.isFinite(duration)&&duration>0;
  if(ready){
    video.pause();
    video.currentTime=0;
    scrollUpdate();
  }
});

video.addEventListener("error",()=>{
  counter.textContent="CAMERA ERROR";
});

function scrollUpdate(){
  const rect=section.getBoundingClientRect();
  const range=Math.max(1,section.offsetHeight-innerHeight);
  const p=Math.max(0,Math.min(1,-rect.top/range));
  progress.style.width=(p*100)+"%";
  if(ready){
    targetTime=p*duration;
    counter.textContent=Math.floor(targetTime*30+1).toString().padStart(3,"0");
  }
}

function animate(){
  currentTime+=(targetTime-currentTime)*.2;
  if(Math.abs(targetTime-currentTime)<.01)currentTime=targetTime;
  if(ready && Number.isFinite(currentTime)){
    try{ video.currentTime=currentTime; }catch(e){}
  }
  requestAnimationFrame(animate);
}

addEventListener("scroll",scrollUpdate,{passive:true});
addEventListener("resize",scrollUpdate);
scrollUpdate();
animate();