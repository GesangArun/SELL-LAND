const ADMIN_STORAGE_KEY = "archimax-admin-drafts";

const adminForm = document.querySelector(".admin-form");
const queueList = document.querySelector(".queue-list");
const previewImage = document.getElementById("preview-image");
const previewName = document.getElementById("preview-name");
const previewLocation = document.getElementById("preview-location");
const previewSize = document.getElementById("preview-size");
const previewPrice = document.getElementById("preview-price");
const previewCategory = document.getElementById("preview-category");
const draftCount = document.getElementById("draft-count");
const avgPrice = document.getElementById("avg-price");
const clearDraftBtn = document.getElementById("clear-draft");
const exportCsvBtn = document.getElementById("export-csv");
let tempImage = "";

const rupiah = (value) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const loadDrafts = () => {
  try {
    return JSON.parse(localStorage.getItem(ADMIN_STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
};

let drafts = loadDrafts();

const persistDrafts = () =>
  localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(drafts));

const updateSummary = () => {
  const total = drafts.reduce((sum, item) => sum + Number(item.price || 0), 0);
  draftCount.textContent = `${drafts.length} item`;
  avgPrice.textContent =
    drafts.length > 0 ? rupiah(total / drafts.length) : "Rp0";
};

const emptyState = () => {
  const holder = document.createElement("div");
  holder.className = "queue-empty";
  holder.innerHTML = `
    <p>Belum ada draft. Simpan data melalui form di atas.</p>
  `;
  return holder;
};

const renderQueue = () => {
  if (!queueList) return;
  queueList.innerHTML = "";
  if (!drafts.length) {
    queueList.append(emptyState());
    updateSummary();
    return;
  }

  drafts.forEach((draft, index) => {
    const item = document.createElement("article");
    item.className = "queue-item";
    item.innerHTML = `
      <div class="queue-item-image" style="background-image:url('${
        draft.image || ""
      }')"></div>
      <div class="queue-item-body">
        <p class="queue-category">${draft.category}</p>
        <h3>${draft.name}</h3>
        <p>${draft.location}</p>
        <p>${Number(draft.size).toLocaleString("id-ID")} m²</p>
        <strong>${rupiah(draft.price)}</strong>
        ${
          draft.notes
            ? `<p class="queue-notes">${draft.notes
                .split(",")
                .map((n) => n.trim())
                .filter(Boolean)
                .slice(0, 3)
                .join(" • ")}</p>`
            : ""
        }
      </div>
      <button class="queue-remove" data-index="${index}" aria-label="Hapus draft">
        ✕
      </button>
    `;
    queueList.append(item);
  });
  updateSummary();
};

const handleRemove = (event) => {
  const button = event.target.closest(".queue-remove");
  if (!button) return;
  const index = Number(button.dataset.index);
  drafts.splice(index, 1);
  persistDrafts();
  renderQueue();
};

queueList?.addEventListener("click", handleRemove);

const readImage = (file) =>
  new Promise((resolve) => {
    if (!file) return resolve("");
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(file);
  });

const resetPreview = () => {
  tempImage = "";
  previewImage.textContent = "Tidak ada foto";
  previewImage.style.backgroundImage = "";
  previewName.textContent = "Nama proyek";
  previewLocation.textContent = "Lokasi akan tampil di sini";
  previewSize.textContent = "0 m²";
  previewPrice.textContent = "Rp0";
  previewCategory.textContent = "Kategori belum dipilih";
};

const updatePreview = (data) => {
  if (data.image) {
    previewImage.textContent = "";
    previewImage.style.backgroundImage = `url('${data.image}')`;
  } else {
    previewImage.textContent = "Tidak ada foto";
    previewImage.style.backgroundImage = "";
  }
  previewName.textContent = data.name || "Nama proyek";
  previewLocation.textContent = data.location || "Lokasi akan tampil di sini";
  previewSize.textContent = data.size
    ? `${Number(data.size).toLocaleString("id-ID")} m²`
    : "0 m²";
  previewPrice.textContent = rupiah(data.price);
  previewCategory.textContent = data.category || "Kategori belum dipilih";
};

adminForm?.addEventListener("input", (event) => {
  const formData = Object.fromEntries(new FormData(adminForm));
  if (event.target.name === "photo") {
    const file = event.target.files?.[0];
    if (!file) {
      tempImage = "";
      updatePreview({ ...formData, image: tempImage });
      return;
    }
    readImage(file).then((image) => {
      tempImage = image;
      updatePreview({ ...formData, image: tempImage });
    });
    return;
  }
  updatePreview({ ...formData, image: tempImage });
});

adminForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(adminForm);
  const values = Object.fromEntries(formData);
  const file = formData.get("photo");
  values.image = await readImage(file);
  values.createdAt = Date.now();
  drafts = [values, ...drafts];
  persistDrafts();
  renderQueue();
  adminForm.reset();
  resetPreview();
});

clearDraftBtn?.addEventListener("click", () => {
  if (!drafts.length) return;
  const confirmation = confirm("Hapus semua draft yang tersimpan di perangkat?");
  if (!confirmation) return;
  drafts = [];
  persistDrafts();
  renderQueue();
  resetPreview();
});

exportCsvBtn?.addEventListener("click", () => {
  if (!drafts.length) {
    alert("Tidak ada data untuk diekspor.");
    return;
  }
  const header = ["Nama", "Lokasi", "Luas", "Harga", "Kategori", "Catatan"];
  const rows = drafts.map((draft) => [
    draft.name,
    draft.location,
    draft.size,
    draft.price,
    draft.category,
    `"${draft.notes || ""}"`,
  ]);
  const csv = [header, ...rows].map((row) => row.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "draft_archimax.csv";
  link.click();
  URL.revokeObjectURL(url);
});

renderQueue();
resetPreview();

