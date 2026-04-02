// createQr.js
import { collection, query, where, getDocs }
from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";
import { createQr } from "./libraryQr.js";
import { renderQr } from "./qrRender.js";

const btn        = document.getElementById("btn-lookup");
const emailInput = document.getElementById("lookup-email");
const alertEl    = document.getElementById("lookup-alert");

btn?.addEventListener("click", async () => {
  const email = emailInput.value.trim();
  alertEl.textContent = "";

  if (!email) { alertEl.textContent = "Ingresa tu correo."; return; }

  alertEl.textContent = "Buscando...";

  const snap = await getDocs(query(
    collection(window.db, "students"),
    where("email", "==", email)
  ));

  if (snap.empty) { alertEl.textContent = "Correo no encontrado."; return; }

  alertEl.textContent = "";

  const uid  = snap.docs[0].id;
  const data = snap.docs[0].data();

  const qrImg = await createQr(uid);

  renderQr(data.nombre, data.estandar ?? "", qrImg);
});