// scanQr.js
import { createQrScanner } from "./libraryQr.js";
import {
  doc, getDoc, setDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";

let scannerInstance = null;
let currentEventoId  = null;
let currentAdminId   = null;
let currentEstandar  = null;

// ─── Overlay HTML ──────────────────────────────────────────────────────────────
function buildOverlay() {
  const div = document.createElement("div");
  div.id        = "qr-overlay";
  div.className = "qr-overlay hidden";
  div.innerHTML = `
    <div class="qr-box">

      <!-- Tabs -->
      <div class="qr-tabs">
        <button class="qr-tab active" data-tab="camera">Cámara</button>
        <button class="qr-tab"        data-tab="file">Subir imagen</button>
      </div>

      <!-- Camera panel -->
      <div class="qr-panel" id="qr-panel-camera">
        <div class="qr-viewport">
          <div id="qr-reader"></div>
          <!-- Marco de escaneo -->
          <div class="qr-frame">
            <span class="qr-corner tl"></span>
            <span class="qr-corner tr"></span>
            <span class="qr-corner bl"></span>
            <span class="qr-corner br"></span>
            <div class="qr-laser"></div>
          </div>
        </div>
      </div>

      <!-- File panel -->
      <div class="qr-panel hidden" id="qr-panel-file">
        <label class="qr-upload-label" for="qr-file-input">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="1.5">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          <span>Haz clic o arrastra una imagen con el QR</span>
        </label>
        <input type="file" id="qr-file-input" accept="image/*" style="display:none">
        <img id="qr-preview" class="qr-preview hidden" alt="preview">
      </div>

      <!-- Status -->
      <div id="qr-status" class="qr-status">Apunta la cámara al código QR</div>

      <!-- Close -->
      <button id="qr-close" class="qr-close-btn">✕ Cerrar</button>
    </div>
  `;
  document.body.appendChild(div);
}

// ─── Estilos del overlay ───────────────────────────────────────────────────────
function injectStyles() {
  if (document.getElementById("qr-styles")) return;
  const style = document.createElement("style");
  style.id = "qr-styles";
  style.textContent = `
    .qr-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.88);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
    }
    .qr-overlay.hidden { display: none; }

    .qr-box {
      background: #111;
      border-radius: 16px;
      padding: 24px 20px 20px;
      width: 340px;
      display: flex;
      flex-direction: column;
      gap: 14px;
      box-shadow: 0 0 60px rgba(0,255,159,0.15);
    }

    /* Tabs */
    .qr-tabs {
      display: flex;
      gap: 8px;
    }
    .qr-tab {
      flex: 1;
      padding: 8px;
      background: #222;
      color: #888;
      border: 1px solid #333;
      border-radius: 8px;
      cursor: pointer;
      font-size: 13px;
      transition: all .2s;
    }
    .qr-tab.active {
      background: #00ff9f18;
      color: #00ff9f;
      border-color: #00ff9f55;
    }

    /* Viewport cámara */
    .qr-viewport {
      position: relative;
      width: 300px;
      height: 300px;
      margin: 0 auto;
      overflow: hidden;
      border-radius: 10px;
      background: #000;
    }

    /* html5-qrcode ocupa 100% del viewport */
    .qr-viewport #qr-reader {
      width: 300px !important;
      height: 300px !important;
    }
    /* ocultar UI nativa de html5-qrcode */
    .qr-viewport #qr-reader > * { border: none !important; }
    .qr-viewport #qr-reader img,
    .qr-viewport #qr-reader select,
    .qr-viewport #qr-reader button { display: none !important; }
    .qr-viewport #qr-reader video {
      width: 100% !important;
      height: 100% !important;
      object-fit: cover;
    }

    /* Marco de escaneo */
    .qr-frame {
      position: absolute;
      inset: 0;
      pointer-events: none;
    }
    .qr-corner {
      position: absolute;
      width: 24px;
      height: 24px;
      border-color: #00ff9f;
      border-style: solid;
      border-width: 0;
    }
    .qr-corner.tl { top: 18px;    left: 18px;   border-top-width: 3px; border-left-width: 3px;   border-radius: 4px 0 0 0; }
    .qr-corner.tr { top: 18px;    right: 18px;  border-top-width: 3px; border-right-width: 3px;  border-radius: 0 4px 0 0; }
    .qr-corner.bl { bottom: 18px; left: 18px;   border-bottom-width: 3px; border-left-width: 3px;  border-radius: 0 0 0 4px; }
    .qr-corner.br { bottom: 18px; right: 18px;  border-bottom-width: 3px; border-right-width: 3px; border-radius: 0 0 4px 0; }

    /* Línea láser */
    .qr-laser {
      position: absolute;
      left: 18px;
      right: 18px;
      height: 2px;
      background: linear-gradient(90deg, transparent, #00ff9f, transparent);
      box-shadow: 0 0 8px #00ff9f;
      top: 18px;
      animation: laser 2s ease-in-out infinite;
    }
    @keyframes laser {
      0%   { top: 18px;  opacity: 1; }
      48%  { opacity: 1; }
      50%  { top: calc(100% - 20px); opacity: 0.6; }
      52%  { opacity: 1; }
      100% { top: 18px;  opacity: 1; }
    }
    @media (prefers-reduced-motion: reduce) {
      .qr-laser { animation: none; top: 50%; }
    }

    /* Panel archivo */
    .qr-upload-label {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 12px;
      height: 220px;
      border: 2px dashed #333;
      border-radius: 10px;
      cursor: pointer;
      color: #666;
      font-size: 13px;
      text-align: center;
      transition: border-color .2s, color .2s;
    }
    .qr-upload-label:hover {
      border-color: #00ff9f55;
      color: #00ff9f;
    }
    .qr-preview {
      width: 100%;
      border-radius: 8px;
      margin-top: 10px;
    }
    .qr-preview.hidden { display: none; }
    .qr-panel.hidden   { display: none; }

    /* Status */
    .qr-status {
      font-size: 13px;
      color: #888;
      text-align: center;
      min-height: 20px;
      transition: color .2s;
    }
    .qr-status.ok    { color: #00ff9f; }
    .qr-status.error { color: #ff4d4d; }
    .qr-status.warn  { color: #f0a500; }

    /* Botón cerrar */
    .qr-close-btn {
      background: #1a1a1a;
      color: #666;
      border: 1px solid #333;
      border-radius: 8px;
      padding: 8px;
      cursor: pointer;
      font-size: 13px;
      transition: color .2s, border-color .2s;
    }
    .qr-close-btn:hover { color: #ff4d4d; border-color: #ff4d4d55; }
  `;
  document.head.appendChild(style);
}

// ─── Helpers de estado ─────────────────────────────────────────────────────────
function setStatus(msg, type = "") {
  const el = document.getElementById("qr-status");
  if (!el) return;
  el.textContent = msg;
  el.className = "qr-status " + type;
}

// ─── Lógica de Firestore ───────────────────────────────────────────────────────
async function processUid(uid) {
  setStatus("Procesando...");

  const studentSnap = await getDoc(doc(window.db, "students", uid));
  if (!studentSnap.exists()) {
    setStatus("QR inválido o estudiante no encontrado", "error");
    return false;
  }

  const student = studentSnap.data();
  if (student.estandar !== currentEstandar) {
    setStatus(`No pertenece a este estándar (${student.estandar})`, "error");
    return false;
  }

  const id  = `${currentEventoId}_${uid}`;
  const ref = doc(window.db, "asistencias", id);
  if ((await getDoc(ref)).exists()) {
    setStatus(`${student.nombre} — ya estaba registrado`, "warn");
    return false;
  }

    await setDoc(ref, {
    eventoId:    currentEventoId,
    adminId:     currentAdminId,
    estandar:    currentEstandar,
    studentId:   uid,
    studentName: student.nombre,   // ← agrega esta línea
    fecha:       serverTimestamp()
    });

  setStatus(`✔ ${student.nombre} registrado`, "ok");
  return true;
}

// ─── Modo cámara ───────────────────────────────────────────────────────────────
function startCamera() {
  if (scannerInstance) return;

  setTimeout(() => {
    scannerInstance = createQrScanner(
      "qr-reader",
      async (uid) => {
        const ok = await processUid(uid);
        if (ok) setTimeout(stopScanner, 1200);
      },
      () => {} // errores de frame ignorados (son normales)
    );
    scannerInstance.start().catch(() => {
      setStatus("No se pudo acceder a la cámara", "error");
    });
  }, 80);
}

async function stopCamera() {
  if (scannerInstance) {
    await scannerInstance.stop();
    scannerInstance = null;
  }
}

// ─── Modo imagen ───────────────────────────────────────────────────────────────
function setupFileMode() {
  const input   = document.getElementById("qr-file-input");
  const label   = document.querySelector(".qr-upload-label");
  const preview = document.getElementById("qr-preview");

  // drag & drop
  label.addEventListener("dragover", e => { e.preventDefault(); label.style.borderColor = "#00ff9f"; });
  label.addEventListener("dragleave",  () => { label.style.borderColor = ""; });
  label.addEventListener("drop", e => {
    e.preventDefault();
    label.style.borderColor = "";
    const file = e.dataTransfer.files[0];
    if (file) handleImageFile(file);
  });

  input.addEventListener("change", () => {
    if (input.files[0]) handleImageFile(input.files[0]);
  });

  async function handleImageFile(file) {
    if (!file.type.startsWith("image/")) {
      setStatus("El archivo no es una imagen", "error");
      return;
    }

    // Mostrar preview
    const url = URL.createObjectURL(file);
    preview.src = url;
    preview.classList.remove("hidden");
    setStatus("Analizando imagen...");

    try {
      // html5-qrcode puede escanear desde archivo directamente
      const { Html5Qrcode } = await import("https://esm.sh/html5-qrcode");
      const scanner = new Html5Qrcode("qr-file-reader-hidden");
      const result  = await scanner.scanFile(file, false);
      await scanner.clear();
      await processUid(result);
    } catch {
      setStatus("No se detectó un QR válido en la imagen", "error");
    }
  }
}

// ─── Tabs ──────────────────────────────────────────────────────────────────────
function setupTabs() {
  const tabs = document.querySelectorAll(".qr-tab");
  tabs.forEach(tab => {
    tab.addEventListener("click", async () => {
      const target = tab.dataset.tab;

      tabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");

      document.getElementById("qr-panel-camera").classList.toggle("hidden", target !== "camera");
      document.getElementById("qr-panel-file").classList.toggle("hidden",   target !== "file");

      if (target === "camera") {
        startCamera();
        setStatus("Apunta la cámara al código QR");
      } else {
        await stopCamera();
        setStatus("Sube una imagen con el código QR");
      }
    });
  });
}

// ─── API pública ───────────────────────────────────────────────────────────────
export function openScanner(eventoId, adminId, estandar) {
  currentEventoId = eventoId;
  currentAdminId  = adminId;
  currentEstandar = estandar;

  injectStyles();

  // Crear overlay si no existe
  if (!document.getElementById("qr-overlay")) {
    buildOverlay();

    // Div oculto para scanFile (necesita un elemento en el DOM)
    const hidden = document.createElement("div");
    hidden.id    = "qr-file-reader-hidden";
    hidden.style.display = "none";
    document.body.appendChild(hidden);

    setupTabs();
    setupFileMode();
    document.getElementById("qr-close").onclick = stopScanner;
  }

  const overlay = document.getElementById("qr-overlay");
  overlay.classList.remove("hidden");

  // Resetear preview y status
  const preview = document.getElementById("qr-preview");
  if (preview) preview.classList.add("hidden");
  setStatus("Apunta la cámara al código QR");

  // Activar tab cámara por defecto
  document.querySelectorAll(".qr-tab").forEach(t => t.classList.toggle("active", t.dataset.tab === "camera"));
  document.getElementById("qr-panel-camera").classList.remove("hidden");
  document.getElementById("qr-panel-file").classList.add("hidden");

  startCamera();
}

async function stopScanner() {
  await stopCamera();
  document.getElementById("qr-overlay")?.classList.add("hidden");
}