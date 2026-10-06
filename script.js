const canvas = document.getElementById("sequence");
const ctx = canvas.getContext("2d");
const section = document.getElementById("camera-sequence");
const loading = document.getElementById("loading");
const counter = document.getElementById("counter");
const progressBar = document.getElementById("progress");

const FRAME_COUNT = 169;
const FRAME_PATH = "./frames/frame-";
const MAX_DPR = 2;

const images = new Array(FRAME_COUNT);
let loadedCount = 0;
let targetFrame = 0;
let currentFrame = 0;
let lastFrame = -1;
let ready = false;
let raf = 0;

function setLoading(percent, label = "LOADING CAMERA") {
  if (!loading) return;
  const b = loading.querySelector("b");
  loading.firstChild.textContent = label + " ";
  if (b) b.textContent = Math.round(percent) + "%";
  if (percent >= 100) {
    setTimeout(() => loading.classList.add("done"), 300);
  }
}

function resizeCanvas() {
  const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
  canvas.width = Math.max(1, Math.round(window.innerWidth * dpr));
  canvas.height = Math.max(1, Math.round(window.innerHeight * dpr));
  canvas.style.width = "100vw";
  canvas.style.height = "100vh";
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  drawFrame(lastFrame < 0 ? 0 : lastFrame);
}

function frameUrl(index) {
  return FRAME_PATH + String(index + 1).padStart(3, "0") + ".jpg";
}

function loadFrame(index) {
  return new Promise(resolve => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => {
      images[index] = img;
      loadedCount++;
      resolve(true);
    };
    img.onerror = () => resolve(false);
    img.src = frameUrl(index);
  });
}

async function loadSequence() {
  // Load the first frame immediately so the page never sits on a black screen.
  const first = await loadFrame(0);

  if (!first) {
    loading.classList.add("error");
    loading.innerHTML = "CAMERA LOAD FAILED — <b>FRAME 001</b>";
    return;
  }

  ready = true;
  setLoading(8, "CAMERA READY");
  drawFrame(0);

  // Load several frames in parallel. This is much faster and lighter than
  // downloading/extracting the ZIP in the visitor's browser.
  const batchSize = 12;

  for (let start = 1; start < FRAME_COUNT; start += batchSize) {
    const jobs = [];
    for (let i = start; i < Math.min(start + batchSize, FRAME_COUNT); i++) {
      jobs.push(loadFrame(i));
    }
    await Promise.all(jobs);
    setLoading(8 + (loadedCount / FRAME_COUNT) * 92, "PREPARING CAMERA");
  }

  setLoading(100, "CAMERA READY");
}

function nearestLoaded(index) {
  index = Math.max(0, Math.min(FRAME_COUNT - 1, index));
  if (images[index]) return index;

  for (let d = 1; d < FRAME_COUNT; d++) {
    if (index - d >= 0 && images[index - d]) return index - d;
    if (index + d < FRAME_COUNT && images[index + d]) return index + d;
  }
  return 0;
}

function drawFrame(index) {
  if (!ready) return;

  const actual = nearestLoaded(Math.round(index));
  if (actual === lastFrame && lastFrame >= 0) return;

  const image = images[actual];
  if (!image || !image.naturalWidth) return;

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const scale = Math.max(vw / image.naturalWidth, vh / image.naturalHeight);
  const w = image.naturalWidth * scale;
  const h = image.naturalHeight * scale;
  const x = (vw - w) / 2;
  const y = (vh - h) / 2;

  ctx.fillStyle = "#070707";
  ctx.fillRect(0, 0, vw, vh);
  ctx.drawImage(image, x, y, w, h);

  lastFrame = actual;
}

function updateScroll() {
  if (!section) return;

  const rect = section.getBoundingClientRect();
  const scrollable = Math.max(1, section.offsetHeight - window.innerHeight);
  const progress = Math.max(0, Math.min(1, -rect.top / scrollable));

  targetFrame = progress * (FRAME_COUNT - 1);

  if (progressBar) {
    progressBar.style.width = (progress * 100) + "%";
  }

  if (counter) {
    counter.textContent =
      String(Math.round(targetFrame) + 1).padStart(3, "0") +
      " / " + FRAME_COUNT;
  }
}

function animate() {
  currentFrame += (targetFrame - currentFrame) * 0.2;
  if (Math.abs(targetFrame - currentFrame) < 0.02) {
    currentFrame = targetFrame;
  }

  drawFrame(currentFrame);
  raf = requestAnimationFrame(animate);
}

window.addEventListener("resize", resizeCanvas);
window.addEventListener("scroll", updateScroll, { passive: true });
window.addEventListener("beforeunload", () => cancelAnimationFrame(raf));

resizeCanvas();
updateScroll();
loadSequence();
animate();
