const track = document.querySelector(".testimonial-track");
const cards = track ? Array.from(track.querySelectorAll(".testimonial")) : [];
const prev = document.querySelector(".control.prev");
const next = document.querySelector(".control.next");
let current = 0;

function updateTestimonials(direction = 1) {
  if (!track || !cards.length) return;
  cards[current].classList.remove("active");
  current = (current + direction + cards.length) % cards.length;
  cards[current].classList.add("active");
  track.scrollTo({
    left: cards[current].offsetLeft - track.offsetLeft,
    behavior: "smooth",
  });
}

if (track && cards.length > 1) {
  prev?.addEventListener("click", () => updateTestimonials(-1));
  next?.addEventListener("click", () => updateTestimonials(1));
}

const contactForm = document.querySelector(".contact-form");
contactForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = Object.fromEntries(new FormData(contactForm));
  alert(
    `Terima kasih ${formData.name}! Tim kami akan menghubungi via ${formData.email}.`
  );
  contactForm.reset();
});

const STORAGE_KEY = "archimax-insertions";
const insertForm = document.querySelector(".insert-form");
const dynamicGrid = document.querySelector(".dynamic-listings");

function rupiah(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function parseHighlights(text = "") {
  return text
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function buildCard({ name, size, location, price, category, image, notes }) {
  const card = document.createElement("article");
  card.className = "listing-card";
  const highlights = parseHighlights(notes);
  card.innerHTML = `
    <div class="tags"><span>${category}</span><span>Baru</span></div>
    <h3>${name}</h3>
    <p>${Number(size).toLocaleString("id-ID")} m² • Listing komunitas</p>
    <p class="location">${location}</p>
    <div class="listing-image" style="background-image:url('${image}')"></div>
    ${
      highlights.length
        ? `<ul>${highlights
            .map((item) => `<li>${item}</li>`)
            .join("")}</ul>`
        : ""
    }
    <div class="card-footer">
      <strong>${rupiah(price)}</strong>
      <button class="btn ghost">Hubungi</button>
    </div>
  `;
  return card;
}

function persist(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function loadPersisted() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function renderListings(listings) {
  if (!dynamicGrid) return;
  dynamicGrid.innerHTML = "";
  listings.forEach((item) => dynamicGrid.prepend(buildCard(item)));
}

let existingListings = loadPersisted();
renderListings(existingListings);

insertForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = Object.fromEntries(new FormData(insertForm));
  const newListing = {
    ...formData,
    createdAt: Date.now(),
  };
  existingListings = [...existingListings, newListing];
  persist(existingListings);
  renderListings(existingListings);
  insertForm.reset();
});

