const canvas = document.getElementById("sequence");
const ctx = canvas.getContext("2d", { alpha: false });
const section = document.getElementById("camera-sequence");
const loading = document.getElementById("loading");
const counter = document.getElementById("counter");
const progressBar = document.getElementById("progress");

const ZIP_URL = "./Final-attempt-camera-frames.zip";
const MAX_DPR = 2;

let frames = [];
let images = [];
let loaded = [];
let targetFrame = 0;
let currentFrame = 0;
let lastDrawnFrame = 0;
let ready = false;
let raf = 0;
let objectUrls = [];

function setLoading(percent, text = "LOADING CAMERA") {
  if (!loading) return;
  const b = loading.querySelector("b");
  loading.firstChild.textContent = text + " ";
  if (b) b.textContent = Math.round(percent) + "%";
  if (percent >= 100) setTimeout(() => loading.classList.add("done"), 350);
}

function resizeCanvas() {
  const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
  canvas.width = Math.max(1, Math.round(window.innerWidth * dpr));
  canvas.height = Math.max(1, Math.round(window.innerHeight * dpr));
  canvas.style.width = "100vw";
  canvas.style.height = "100vh";
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  drawFrame(lastDrawnFrame);
}

function sortFrames(names) {
  return names
    .filter(name => /\.(jpe?g|png|webp)$/i.test(name))
    .sort((a, b) => {
      const na = (a.match(/\d+/g) || []).map(Number);
      const nb = (b.match(/\d+/g) || []).map(Number);
      if (na.length && nb.length) {
        for (let i = 0; i < Math.min(na.length, nb.length); i++) {
          if (na[i] !== nb[i]) return na[i] - nb[i];
        }
      }
      return a.localeCompare(b, undefined, { numeric: true });
    });
}

async function loadSequence() {
  try {
    if (!window.JSZip) throw new Error("JSZip failed to load.");

    setLoading(5, "DOWNLOADING CAMERA");
    const response = await fetch(ZIP_URL, { cache: "no-store" });
    if (!response.ok) throw new Error("Camera ZIP request failed: " + response.status);

    const blob = await response.blob();
    setLoading(20, "OPENING CAMERA");
    const zip = await JSZip.loadAsync(blob);

    frames = sortFrames(Object.keys(zip.files).filter(name => !zip.files[name].dir));
    if (!frames.length) throw new Error("No image frames found inside the ZIP.");

    images = new Array(frames.length).fill(null);
    loaded = new Array(frames.length).fill(false);
    counter.textContent = "001 / " + frames.length;

    // Decode frames progressively. The first frame is loaded immediately,
    // then the remaining frames are decoded in small batches.
    const decode = async (index) => {
      if (loaded[index] || images[index]) return;
      const file = zip.file(frames[index]);
      if (!file) return;
      const bytes = await file.async("blob");
      const url = URL.createObjectURL(bytes);
      objectUrls.push(url);
      const img = new Image();
      img.decoding = "async";
      img.src = url;
      await img.decode().catch(() => {});
      images[index] = img;
      loaded[index] = true;
    };

    await decode(0);
    ready = true;
    setLoading(100, "CAMERA READY");
    drawFrame(0);

    // Decode in the background so scrolling can start immediately.
    let next = 1;
    const batch = async () => {
      const end = Math.min(next + 5, frames.length);
      for (; next < end; next++) {
        try { await decode(next); } catch (_) {}
      }
      if (next < frames.length) {
        const pct = 10 + (next / frames.length) * 90;
        setLoading(pct, "PREPARING CAMERA");
        setTimeout(batch, 0);
      }
    };
    batch();
  } catch (error) {
    console.error(error);
    if (loading) {
      loading.classList.add("error");
      loading.innerHTML = "CAMERA LOAD FAILED — <b>CHECK ZIP</b>";
    }
  }
}

function nearestLoaded(index) {
  if (!images.length) return -1;
  index = Math.max(0, Math.min(images.length - 1, index));
  if (loaded[index]) return index;

  for (let d = 1; d < images.length; d++) {
    if (loaded[index - d]) return index - d;
    if (loaded[index + d]) return index + d;
    if (d > 20) break;
  }
  return lastDrawnFrame;
}

function drawFrame(frame) {
  if (!ready || !images.length) return;
  const index = nearestLoaded(Math.round(frame));
  const image = images[index];
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
  lastDrawnFrame = index;
}

function updateScroll() {
  if (!section || !frames.length) return;
  const rect = section.getBoundingClientRect();
  const scrollable = Math.max(1, section.offsetHeight - window.innerHeight);
  const progress = Math.max(0, Math.min(1, -rect.top / scrollable));

  targetFrame = progress * (frames.length - 1);

  if (progressBar) progressBar.style.width = (progress * 100) + "%";
  if (counter) counter.textContent =
    String(Math.round(targetFrame) + 1).padStart(3, "0") + " / " + frames.length;
}

function animate() {
  currentFrame += (targetFrame - currentFrame) * 0.18;
  if (Math.abs(targetFrame - currentFrame) < 0.02) currentFrame = targetFrame;
  drawFrame(currentFrame);
  raf = requestAnimationFrame(animate);
}

window.addEventListener("resize", resizeCanvas);
window.addEventListener("scroll", updateScroll, { passive: true });
window.addEventListener("beforeunload", () => objectUrls.forEach(URL.revokeObjectURL));

resizeCanvas();
loadSequence();
updateScroll();
cancelAnimationFrame(raf);
animate();
