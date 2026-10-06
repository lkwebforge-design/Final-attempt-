const section = document.getElementById("camera-sequence");
const video = document.getElementById("camera");
const loading = document.getElementById("loading");
const counter = document.getElementById("counter");
const progressBar = document.getElementById("progress");
const hint = document.getElementById("hint");

let duration = 0;
let target = 0;
let current = 0;
let ready = false;
let primed = false;
let raf = 0;

function setLoading(percent, label) {
  const b = loading.querySelector("b");
  loading.firstChild.textContent = label + " ";
  if (b) b.textContent = Math.round(percent) + "%";
  if (percent >= 100) {
    setTimeout(() => loading.classList.add("done"), 250);
  }
}

function updateScroll() {
  if (!duration) return;

  const rect = section.getBoundingClientRect();
  const range = Math.max(1, section.offsetHeight - innerHeight);
  const progress = Math.max(0, Math.min(1, -rect.top / range));

  target = progress * Math.max(0, duration - 0.05);

  progressBar.style.width = (progress * 100) + "%";
  counter.textContent =
    current.toFixed(1).padStart(4, "0") + "s / " + duration.toFixed(1) + "s";

  if (progress > 0.015) hint.textContent = "Scroll to control the camera";
}

async function primeVideo() {
  if (primed) return;
  primed = true;

  // Muted + playsinline lets iOS/Safari initialize the decoder.
  try {
    await video.play();
    video.pause();
  } catch (_) {
    // Seeking still works on browsers that reject autoplay.
  }

  try { video.currentTime = 0.001; } catch (_) {}
}

function render() {
  if (ready) {
    // Smoothly follow the scroll position.
    current += (target - current) * 0.28;
    if (Math.abs(target - current) < 0.008) current = target;

    // Direct seeking is deliberately done every animation frame.
    // This is more reliable on Safari/iPhone than waiting for scroll events.
    if (Math.abs(video.currentTime - current) > 0.012) {
      try { video.currentTime = current; } catch (_) {}
    }

    counter.textContent =
      current.toFixed(1).padStart(4, "0") + "s / " + duration.toFixed(1) + "s";
  }

  raf = requestAnimationFrame(render);
}

video.addEventListener("loadedmetadata", async () => {
  duration = video.duration;

  if (!Number.isFinite(duration) || duration <= 0) {
    loading.classList.add("error");
    loading.innerHTML = "CAMERA LOAD FAILED — <b>NO DURATION</b>";
    return;
  }

  ready = true;
  setLoading(70, "INITIALIZING CAMERA");
  await primeVideo();

  try { video.currentTime = 0; } catch (_) {}

  setLoading(100, "CAMERA READY");
  updateScroll();
});

video.addEventListener("canplay", () => {
  if (duration) setLoading(100, "CAMERA READY");
});

video.addEventListener("error", () => {
  console.error("Camera video error:", video.error);
  loading.classList.add("error");
  loading.innerHTML = "CAMERA LOAD FAILED — <b>MP4 ERROR</b>";
});

window.addEventListener("scroll", updateScroll, { passive: true });
window.addEventListener("resize", updateScroll, { passive: true });

video.load();
updateScroll();
render();
