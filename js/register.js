// register.js
import { collection, query, where, getDocs, addDoc }
from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";
import { createQr } from "./libraryQr.js";
import { renderQr } from "./qrRender.js";

const btnRegister   = document.getElementById("button-register");
const btnBack       = document.getElementById("btn-back");
const btnSave       = document.getElementById("btn-save");
const searchZone    = document.getElementById("search-zone");
const registerZone  = document.getElementById("register-zone");
const inputName     = document.getElementById("reg-name");
const inputEmail    = document.getElementById("reg-email");
const inputEstandar = document.getElementById("reg-estandar");
const resultsDiv    = document.getElementById("estandar-results");
const alertEl       = document.getElementById("reg-alert");

// ─── Caché ────────────────────────────────────────────────────────────────────
let cache = null;
async function getEstandares() {
  if (cache) return cache;
  const snap = await getDocs(collection(window.db, "estandares"));
  cache = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  return cache;
}

// ─── Helpers dropdown ─────────────────────────────────────────────────────────
function showDropdown() {
  resultsDiv.style.display = "block";
  requestAnimationFrame(() => requestAnimationFrame(() => resultsDiv.classList.add("visible")));
}

function hideDropdown() {
  resultsDiv.classList.remove("visible");
  setTimeout(() => { resultsDiv.style.display = "none"; }, 200);
}

// ─── Navegación ───────────────────────────────────────────────────────────────
btnRegister.addEventListener("click", () => {
  searchZone.style.display   = "none";
  registerZone.style.display = "block";
  getEstandares();
});

btnBack?.addEventListener("click", () => {
  registerZone.style.display = "none";
  searchZone.style.display   = "block";
  resetForm();
});

// ─── Autocomplete ─────────────────────────────────────────────────────────────
let selectedId = null;
let timer      = null;

function hl(text, q) {
  return (text || "").replace(
    new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"),
    "<mark>$1</mark>"
  );
}

inputEstandar.addEventListener("input", () => {
  const val = inputEstandar.value.trim().toLowerCase();
  selectedId = null;
  clearTimeout(timer);

  if (!val) { hideDropdown(); return; }

  if (resultsDiv.style.display === "none") showDropdown();

  timer = setTimeout(async () => {
    const data    = await getEstandares();
    const matches = data.filter(e =>
      e.codigo?.toLowerCase().includes(val) ||
      e.titulo?.toLowerCase().includes(val)
    ).slice(0, 10);

    if (!matches.length) {
      resultsDiv.innerHTML = `<div class="ec-empty">Sin resultados</div>`;
      return;
    }

    resultsDiv.innerHTML = matches.map(e => `
      <div class="ec-item" data-id="${e.id}" data-codigo="${e.codigo ?? ""}">
        <span class="ec-code">${hl(e.codigo, val)}</span>
        <span class="ec-title">${hl(e.titulo, val)}</span>
      </div>
    `).join("");

    resultsDiv.querySelectorAll(".ec-item").forEach(item => {
      item.addEventListener("mousedown", (e) => {
        e.preventDefault();
        inputEstandar.value = item.dataset.codigo;
        selectedId          = item.dataset.id;
        hideDropdown();
      });
    });
  }, 120);
});

inputEstandar.addEventListener("blur", () => {
  setTimeout(hideDropdown, 150);
});

// ─── Guardar ──────────────────────────────────────────────────────────────────
btnSave.addEventListener("click", async () => {
  const name        = inputName.value.trim();
  const email       = inputEmail.value.trim();
  const estandarTxt = inputEstandar.value.trim();
  const estandarId  = selectedId;

  alertEl.textContent = "";

  if (!name)       { alertEl.textContent = "Ingresa el nombre.";                  return; }
  if (!email)      { alertEl.textContent = "Ingresa el correo.";                  return; }
  if (!estandarId) { alertEl.textContent = "Selecciona un estándar de la lista."; return; }

  alertEl.textContent = "Verificando...";
  const existe = await getDocs(query(
    collection(window.db, "students"),
    where("email", "==", email)
  ));
  if (!existe.empty) {
    alertEl.textContent = "Ese correo ya está registrado. Usa el buscador.";
    return;
  }

  alertEl.textContent = "Guardando...";
  const ref = await addDoc(collection(window.db, "students"), {
    nombre: name, email, estandar: estandarId, fecha: new Date()
  });

  const qrImg = await createQr(ref.id);

  registerZone.style.display = "none";
  searchZone.style.display   = "block";
  resetForm();

  renderQr(name, estandarTxt, qrImg);
});

// ─── Reset ────────────────────────────────────────────────────────────────────
function resetForm() {
  inputName.value      = "";
  inputEmail.value     = "";
  inputEstandar.value  = "";
  alertEl.textContent  = "";
  selectedId           = null;
  resultsDiv.innerHTML = "";
  resultsDiv.style.display = "none";
  resultsDiv.classList.remove("visible");
}