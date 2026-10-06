const canvas = document.getElementById("sequence");
const ctx = canvas.getContext("2d", { alpha: false });
const loading = document.getElementById("loading");
const counter = document.getElementById("counter");
const progressBar = document.getElementById("progress");

const video = document.createElement("video");
video.crossOrigin = "anonymous";
video.preload = "auto";
video.muted = true;
video.playsInline = true;
video.setAttribute("playsinline", "");
video.setAttribute("webkit-playsinline", "");

// Use a CDN copy of the GitHub file so mobile Safari can fetch the MP4 reliably.
video.src = "https://cdn.jsdelivr.net/gh/lkwebforge-design/Final-attempt-@main/DAD11FBC-C257-4ED7-B269-BC67BDB22D2B.MP4";

let targetProgress = 0;
let currentProgress = 0;
let ready = false;
let drawing = false;

function resizeCanvas() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(window.innerWidth * dpr);
  canvas.height = Math.round(window.innerHeight * dpr);
  canvas.style.width = "100vw";
  canvas.style.height = "100vh";
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  draw();
}

function draw() {
  if (!ready || !video.videoWidth || video.readyState < 2) return;

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const scale = Math.max(vw / video.videoWidth, vh / video.videoHeight);
  const w = video.videoWidth * scale;
  const h = video.videoHeight * scale;
  const x = (vw - w) / 2;
  const y = (vh - h) / 2;

  ctx.fillStyle = "#070707";
  ctx.fillRect(0, 0, vw, vh);
  ctx.drawImage(video, x, y, w, h);
}

function updateScroll() {
  const section = document.getElementById("camera-sequence");
  if (!section) return;

  const rect = section.getBoundingClientRect();
  const scrollable = Math.max(1, section.offsetHeight - window.innerHeight);
  targetProgress = Math.min(1, Math.max(0, -rect.top / scrollable));

  if (progressBar) progressBar.style.width = (targetProgress * 100) + "%";
  if (counter) {
    const frame = Math.min(169, Math.max(1, Math.round(targetProgress * 168) + 1));
    counter.textContent = String(frame).padStart(3, "0") + " / 169";
  }
}

function seekToProgress(progress) {
  if (!video.duration || !isFinite(video.duration)) return;
  const time = progress * Math.max(0, video.duration - 0.02);

  if (Math.abs(video.currentTime - time) > 0.006) {
    video.currentTime = time;
  }
}

function animate() {
  currentProgress += (targetProgress - currentProgress) * 0.22;

  if (Math.abs(targetProgress - currentProgress) < 0.0005) {
    currentProgress = targetProgress;
  }

  seekToProgress(currentProgress);
  draw();
  requestAnimationFrame(animate);
}

video.addEventListener("loadedmetadata", () => {
  ready = true;
  if (loading) loading.style.display = "none";
  seekToProgress(0);
  draw();
});

video.addEventListener("loadeddata", () => {
  ready = true;
  draw();
});

video.addEventListener("canplay", () => {
  ready = true;
  if (loading) loading.style.display = "none";
  draw();
});

video.addEventListener("seeked", draw);

video.addEventListener("error", () => {
  if (loading) {
    loading.textContent = "SEQUENCE FAILED TO LOAD";
    loading.style.display = "block";
  }
});

window.addEventListener("scroll", updateScroll, { passive: true });
window.addEventListener("resize", resizeCanvas);

video.load();
resizeCanvas();
updateScroll();
animate();
