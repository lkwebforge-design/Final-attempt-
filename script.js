const section = document.getElementById("camera-sequence");
const video = document.getElementById("camera-video");
const loading = document.getElementById("loading");
const counter = document.getElementById("counter");
const progressBar = document.getElementById("progress");
const hint = document.getElementById("hint");

let duration = 0;
let targetTime = 0;
let currentTime = 0;
let ready = false;
let raf = 0;
let seeking = false;

function setLoading(percent, text) {
  if (!loading) return;
  const b = loading.querySelector("b");
  loading.firstChild.textContent = text + " ";
  if (b) b.textContent = Math.round(percent) + "%";
  if (percent >= 100) {
    setTimeout(() => loading.classList.add("done"), 250);
  }
}

function updateUI(progress) {
  if (progressBar) progressBar.style.width = (progress * 100) + "%";
  if (counter) {
    counter.textContent = duration
      ? currentTime.toFixed(1).padStart(4, "0") + "s / " + duration.toFixed(1) + "s"
      : "00.0s / —";
  }
}

function updateScroll() {
  if (!section || !duration) return;

  const rect = section.getBoundingClientRect();
  const scrollable = Math.max(1, section.offsetHeight - window.innerHeight);
  const progress = Math.max(0, Math.min(1, -rect.top / scrollable));

  targetTime = progress * Math.max(0, duration - 0.03);
  updateUI(progress);

  if (hint && progress > 0.02) hint.textContent = "Scroll to control the camera";
}

function animate() {
  if (ready && duration) {
    currentTime += (targetTime - currentTime) * 0.22;

    if (Math.abs(targetTime - currentTime) < 0.01) {
      currentTime = targetTime;
    }

    // Seek only when the displayed time has moved enough.
    if (!seeking && Math.abs(video.currentTime - currentTime) > 0.025) {
      seeking = true;
      try {
        video.currentTime = currentTime;
      } catch (_) {}
      seeking = false;
    }

    if (counter) {
      counter.textContent =
        currentTime.toFixed(1).padStart(4, "0") + "s / " + duration.toFixed(1) + "s";
    }
  }

  raf = requestAnimationFrame(animate);
}

video.addEventListener("loadedmetadata", () => {
  duration = video.duration;

  if (!Number.isFinite(duration) || duration <= 0) {
    loading.classList.add("error");
    loading.innerHTML = "CAMERA LOAD FAILED — <b>INVALID VIDEO</b>";
    return;
  }

  ready = true;
  currentTime = 0;
  targetTime = 0;
  video.currentTime = 0;

  setLoading(100, "CAMERA READY");
  updateScroll();

  // We never rely on continuous playback. The scroll position controls time.
  video.pause();
});

video.addEventListener("progress", () => {
  if (video.buffered.length && duration) {
    const end = video.buffered.end(video.buffered.length - 1);
    const percent = Math.min(99, (end / duration) * 100);
    setLoading(percent, "PREPARING CAMERA");
  }
});

video.addEventListener("error", () => {
  console.error("Camera video failed to load.", video.error);
  if (loading) {
    loading.classList.add("error");
    loading.innerHTML = "CAMERA LOAD FAILED — <b>CHECK MP4</b>";
  }
});

window.addEventListener("scroll", updateScroll, { passive: true });
window.addEventListener("resize", updateScroll, { passive: true });
window.addEventListener("beforeunload", () => cancelAnimationFrame(raf));

updateScroll();
animate();

// Force metadata loading on browsers that delay it.
video.load();
