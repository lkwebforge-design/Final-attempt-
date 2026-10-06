const video=document.getElementById("camera-video");
const section=document.getElementById("camera-sequence");
const counter=document.getElementById("counter");
const progress=document.getElementById("progress");

let target=0,current=0,duration=0,ready=false;

function update(){
  const rect=section.getBoundingClientRect();
  const range=Math.max(1,section.offsetHeight-innerHeight);
  const p=Math.max(0,Math.min(1,-rect.top/range));
  target=p;
  progress.style.width=(p*100)+"%";
  if(duration){
    counter.textContent=String(Math.round(p*168)+1).padStart(3,"0")+" / 169";
  }
}

function render(){
  current+=(target-current)*0.2;
  if(Math.abs(target-current)<0.001) current=target;
  if(ready && duration){
    const t=current*duration;
    if(Math.abs(video.currentTime-t)>0.02){
      try{video.currentTime=t;}catch(e){}
    }
  }
  requestAnimationFrame(render);
}

video.addEventListener("loadedmetadata",()=>{
  duration=video.duration||0;
  ready=Number.isFinite(duration)&&duration>0;
  counter.textContent="001 / 169";
  update();
});

video.addEventListener("error",()=>{
  counter.textContent="VIDEO ERROR";
});

video.addEventListener("loadeddata",()=>{
  if(!ready && video.duration){
    duration=video.duration;
    ready=true;
  }
});

video.load();
update();
render();
addEventListener("resize",update);
addEventListener("scroll",update,{passive:true});
