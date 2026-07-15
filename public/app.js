// --- Simple screen router ---
const screens = document.querySelectorAll(".screen");
function show(id) {
  screens.forEach((s) => s.classList.toggle("active", s.id === id));
  window.scrollTo(0, 0);
  if (id === "gallery") loadGallery();
}
document.querySelectorAll("[data-go]").forEach((el) => {
  el.addEventListener("click", () => show(el.dataset.go));
});

// --- Upload ---
const fileInput = document.getElementById("fileInput");
const preview = document.getElementById("preview");
const uploadBtn = document.getElementById("uploadBtn");
const uploadStatus = document.getElementById("uploadStatus");
let selectedFiles = [];

fileInput.addEventListener("change", () => {
  selectedFiles = Array.from(fileInput.files).slice(0, 20);
  preview.innerHTML = "";
  selectedFiles.forEach((file) => {
    const img = document.createElement("img");
    img.src = URL.createObjectURL(file);
    preview.appendChild(img);
  });
  uploadBtn.disabled = selectedFiles.length === 0;
  uploadStatus.textContent = selectedFiles.length
    ? `${selectedFiles.length} photo(s) ready`
    : "";
  uploadStatus.className = "status";
});

uploadBtn.addEventListener("click", async () => {
  if (!selectedFiles.length) return;
  uploadBtn.disabled = true;
  uploadStatus.className = "status";
  uploadStatus.textContent = "Uploading… please keep this tab open.";

  const form = new FormData();
  selectedFiles.forEach((f) => form.append("photos", f));

  try {
    const res = await fetch("/api/upload", { method: "POST", body: form });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Upload failed");
    uploadStatus.className = "status success";
    uploadStatus.textContent = `Thank you! ${data.count} photo(s) added to the album. 💕`;
    selectedFiles = [];
    preview.innerHTML = "";
    fileInput.value = "";
  } catch (err) {
    uploadStatus.className = "status error";
    uploadStatus.textContent = err.message || "Something went wrong. Please try again.";
    uploadBtn.disabled = false;
  }
});

// --- Gallery ---
const grid = document.getElementById("grid");
const galleryStatus = document.getElementById("galleryStatus");

async function loadGallery() {
  grid.innerHTML = "";
  galleryStatus.className = "status";
  galleryStatus.textContent = "Loading memories…";
  try {
    const res = await fetch("/api/photos");
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Could not load photos");
    if (!data.photos.length) {
      galleryStatus.textContent = "No photos yet — be the first to share one!";
      return;
    }
    galleryStatus.textContent = "";
    data.photos.forEach((p) => {
      const img = document.createElement("img");
      img.loading = "lazy";
      img.src = `/api/photo/${p.id}`;
      img.alt = "Wedding photo";
      img.addEventListener("click", () => openLightbox(`/api/photo/${p.id}`));
      grid.appendChild(img);
    });
  } catch (err) {
    galleryStatus.className = "status error";
    galleryStatus.textContent = err.message || "Could not load photos.";
  }
}

// --- Lightbox ---
const lightbox = document.getElementById("lightbox");
const lightboxImg = document.getElementById("lightboxImg");
document.getElementById("lightboxClose").addEventListener("click", closeLightbox);
lightbox.addEventListener("click", (e) => {
  if (e.target === lightbox) closeLightbox();
});
function openLightbox(src) {
  lightboxImg.src = src;
  lightbox.classList.add("open");
}
function closeLightbox() {
  lightbox.classList.remove("open");
  lightboxImg.src = "";
}
