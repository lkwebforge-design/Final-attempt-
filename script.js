const canvas = document.getElementById("sequence");
const ctx = canvas.getContext("2d", { alpha: false });
const loading = document.getElementById("loading");
const counter = document.getElementById("counter");
const progressBar = document.getElementById("progress");

const FRAME_COUNT = 169;
const images = new Array(FRAME_COUNT).fill(null);
const loaded = new Array(FRAME_COUNT).fill(false);

let targetFrame = 0;
let currentFrame = 0;
let lastDrawnFrame = 0;
let firstFrameReady = false;
let lastPreloadCenter = -1;

function frameSrc(index) {
  return "frames/frame-" + String(index + 1).padStart(3, "0") + ".jpg";
}

function resizeCanvas() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  canvas.width = Math.round(window.innerWidth * dpr);
  canvas.height = Math.round(window.innerHeight * dpr);
  canvas.style.width = "100vw";
  canvas.style.height = "100vh";

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  drawFrame(lastDrawnFrame);
}

function loadFrame(index) {
  if (index < 0 || index >= FRAME_COUNT || images[index]) return;

  const image = new Image();
  image.decoding = "async";
  images[index] = image;

  image.onload = () => {
    loaded[index] = true;

    if (!firstFrameReady && index === 0) {
      firstFrameReady = true;
      if (loading) loading.style.display = "none";
      drawFrame(0);
    }

    if (Math.abs(index - Math.round(currentFrame)) <= 1) {
      drawFrame(index);
    }
  };

  image.onerror = () => {
    images[index] = null;
    loaded[index] = false;
  };

  image.src = frameSrc(index);
}

function preloadAround(center) {
  center = Math.max(0, Math.min(FRAME_COUNT - 1, center));

  if (center === lastPreloadCenter) return;
  lastPreloadCenter = center;

  // Load the target first, then a generous window around it.
  loadFrame(center);

  for (let distance = 1; distance <= 18; distance++) {
    loadFrame(center - distance);
    loadFrame(center + distance);
  }
}

function getNearestLoadedFrame(index) {
  index = Math.max(0, Math.min(FRAME_COUNT - 1, index));

  if (loaded[index]) return index;

  for (let distance = 1; distance <= 18; distance++) {
    if (loaded[index - distance]) return index - distance;
    if (loaded[index + distance]) return index + distance;
  }

  return lastDrawnFrame;
}

function drawFrame(frame) {
  const index = getNearestLoadedFrame(Math.round(frame));
  const image = images[index];

  if (!image || !loaded[index]) return;

  const vw = window.innerWidth;
  const vh = window.innerHeight;

  const scale = Math.max(
    vw / image.naturalWidth,
    vh / image.naturalHeight
  );

  const width = image.naturalWidth * scale;
  const height = image.naturalHeight * scale;
  const x = (vw - width) / 2;
  const y = (vh - height) / 2;

  ctx.fillStyle = "#070707";
  ctx.fillRect(0, 0, vw, vh);
  ctx.drawImage(image, x, y, width, height);

  lastDrawnFrame = index;
}

function updateScroll() {
  const section = document.getElementById("camera-sequence");
  if (!section) return;

  const rect = section.getBoundingClientRect();
  const scrollable = Math.max(1, section.offsetHeight - window.innerHeight);
  const progress = Math.min(1, Math.max(0, -rect.top / scrollable));

  targetFrame = progress * (FRAME_COUNT - 1);

  const targetIndex = Math.round(targetFrame);
  preloadAround(targetIndex);

  if (progressBar) {
    progressBar.style.width = (progress * 100) + "%";
  }

  if (counter) {
    counter.textContent =
      String(targetIndex + 1).padStart(3, "0") + " / " + FRAME_COUNT;
  }
}

function animate() {
  currentFrame += (targetFrame - currentFrame) * 0.22;

  if (Math.abs(targetFrame - currentFrame) < 0.02) {
    currentFrame = targetFrame;
  }

  drawFrame(currentFrame);
  requestAnimationFrame(animate);
}

window.addEventListener("scroll", updateScroll, { passive: true });
window.addEventListener("resize", resizeCanvas);

preloadAround(0);
resizeCanvas();
updateScroll();
animate();
