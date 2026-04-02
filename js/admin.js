// admin.js
import { getAuthState, logout } from "./auth.js";
import { openScanner } from "./scanQr.js";
import {
  collection, query, where, getDocs,
  doc, getDoc, onSnapshot, orderBy
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";

// ─── Auth guard ───────────────────────────────────────────────────────────────
const isLoggedIn = await getAuthState();
if (!isLoggedIn) {
  window.location.replace("/login.html");
}

const user = window.auth.currentUser;

// ─── Nombre del admin ─────────────────────────────────────────────────────────
// Intenta traer el nombre real desde Firestore; cae al email si no existe
const adminLabel = document.getElementById("admin-name-label");
try {
  const adminSnap = await getDoc(doc(window.db, "users", user.uid));
  adminLabel.textContent = adminSnap.exists()
    ? (adminSnap.data().nombre ?? user.email)
    : user.email;
} catch {
  adminLabel.textContent = user.email;
}

// ─── Logout ───────────────────────────────────────────────────────────────────
document.getElementById("admin-logout")
  ?.addEventListener("click", () => logout());

// ─── Cargar eventos activos del admin ─────────────────────────────────────────
const courseList = document.getElementById("course-list");

const snap = await getDocs(query(
  collection(window.db, "eventos"),
  where("adminId", "==", user.uid),
  where("activo",  "==", true)
));

if (snap.empty) {
  courseList.innerHTML = "<p>No tienes cursos activos.</p>";
} else {
  for (const docSnap of snap.docs) {
    const evento = docSnap.data();

    const estandarSnap = await getDoc(doc(window.db, "estandares", evento.estandar));
    const estandar = estandarSnap.exists() ? estandarSnap.data() : null;

    const card = document.createElement("div");
    card.className = "course-item";
    card.innerHTML = `
      <strong>${estandar?.titulo ?? evento.estandar}</strong>
      <span>📋 ${estandar?.codigo ?? "—"} · Nivel ${estandar?.nivel ?? "—"}</span>
      <span>📍 ${evento.lugar}</span>
    `;
    card.addEventListener("click", (e) =>
      loadCourseDetail(e, docSnap.id, evento, estandar)
    );
    courseList.appendChild(card);
  }
}

// ─── Detalle de curso ─────────────────────────────────────────────────────────
let unsubAttendance = null;

function loadCourseDetail(e, eventoId, evento, estandar) {
  // Marcar card activa
  document.querySelectorAll(".course-item")
    .forEach(c => c.classList.remove("active"));
  e.currentTarget.classList.add("active");

  // Mostrar panel de detalle
  document.getElementById("dinamic").style.display = "block";

  // Título y meta
  document.getElementById("detail-title").textContent =
    estandar?.titulo ?? evento.estandar;

  document.getElementById("detail-meta").innerHTML = `
    <span>📋 ${estandar?.codigo  ?? "—"}</span>
    <span>🏢 ${estandar?.comite  ?? "—"}</span>
    <span>⭐ Nivel ${estandar?.nivel ?? "—"}</span>
    <span>🏭 ${estandar?.sector  ?? "—"}</span>
  `;

  // Botón scan — clonar para limpiar listeners al cambiar de evento
  const btnScan  = document.getElementById("btn-scan-qr");
  const btnClone = btnScan.cloneNode(true);
  btnScan.parentNode.replaceChild(btnClone, btnScan);
  btnClone.addEventListener("click", () =>
    openScanner(eventoId, user.uid, evento.estandar)
  );

  // Cancelar listener anterior antes de abrir uno nuevo
  if (unsubAttendance) unsubAttendance();

  const list = document.getElementById("attendance-list");
  list.innerHTML = "<li>Cargando...</li>";

  // Asistencias en tiempo real
  unsubAttendance = onSnapshot(
    query(
      collection(window.db, "asistencias"),
      where("eventoId", "==", eventoId),
      orderBy("fecha", "desc")
    ),
    (snapA) => {
      list.innerHTML = "";

      // Info del evento siempre visible arriba
      const fecha = evento.fecha?.toDate().toLocaleDateString("es-CO") ?? "—";
      list.innerHTML = `
        <li>📅 ${fecha}</li>
        <li>📍 ${evento.lugar} · 📌 ${evento.titulo}</li>
        <li style="margin: 8px 0 4px; font-weight:600;">
          Asistencias (${snapA.size})
        </li>
      `;

      if (snapA.empty) {
        const li = document.createElement("li");
        li.style.color = "#999";
        li.textContent = "Sin asistencias aún.";
        list.appendChild(li);
        return;
      }

      snapA.forEach(docA => {
        const d    = docA.data();
        const ts   = d.fecha?.toDate?.().toLocaleString("es-CO") ?? "—";
        // studentName si existe, fallback al id para registros viejos
        const name = d.studentName ?? d.studentId;
        const li   = document.createElement("li");
        li.textContent = `👤 ${name} · ${ts}`;
        list.appendChild(li);
      });
    },
    (err) => {
      console.error("onSnapshot asistencias →", err);
      list.innerHTML = "<li>❌ Error al cargar asistencias.</li>";
    }
  );
}