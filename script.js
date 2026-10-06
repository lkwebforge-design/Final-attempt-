const canvas = document.getElementById("sequence");
const ctx = canvas.getContext("2d");
const video = document.createElement("video");

video.src = "DAD11FBC-C257-4ED7-B269-BC67BDB22D2B.MP4";
video.preload = "auto";
video.muted = true;
video.playsInline = true;

let targetProgress = 0;
let currentProgress = 0;
let ready = false;

function resizeCanvas() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  canvas.style.width = "100vw";
  canvas.style.height = "100vh";
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  draw();
}

function draw() {
  if (!ready || !video.videoWidth) return;
  const vw = window.innerWidth, vh = window.innerHeight;
  const scale = Math.max(vw / video.videoWidth, vh / video.videoHeight);
  const w = video.videoWidth * scale, h = video.videoHeight * scale;
  const x = (vw - w) / 2, y = (vh - h) / 2;
  ctx.clearRect(0, 0, vw, vh);
  ctx.drawImage(video, x, y, w, h);
}

function updateScroll() {
  const section = document.querySelector(".camera-sequence");
  if (!section) return;
  const rect = section.getBoundingClientRect();
  const scrollable = Math.max(1, section.offsetHeight - window.innerHeight);
  targetProgress = Math.min(1, Math.max(0, -rect.top / scrollable));
}

function seekToProgress(progress) {
  if (!video.duration || !isFinite(video.duration)) return;
  const time = progress * Math.max(0, video.duration - 0.001);
  if (Math.abs(video.currentTime - time) > 0.003) video.currentTime = time;
}

function animate() {
  currentProgress += (targetProgress - currentProgress) * 0.16;
  if (Math.abs(targetProgress - currentProgress) < 0.0005) currentProgress = targetProgress;
  seekToProgress(currentProgress);
  draw();
  requestAnimationFrame(animate);
}

video.addEventListener("loadeddata", () => {
  ready = true;
  seekToProgress(0);
  draw();
});

video.addEventListener("loadedmetadata", () => {
  const loading = document.querySelector(".loading");
  if (loading) loading.style.display = "none";
});

window.addEventListener("scroll", updateScroll, { passive: true });
window.addEventListener("resize", resizeCanvas);

resizeCanvas();
updateScroll();
animate();
