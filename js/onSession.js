// onSession.js
import { signOut } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";

const page = document.body.dataset.page;

export function handleSession(isLoggedIn) {
  console.log("onSession →", isLoggedIn, "| página:", page);

  if (!isLoggedIn) {
    if (page === "admin") window.location.replace("/login.html");
  } else {
    if (page === "login") {
      window.location.replace("/admin.html");
      return;
    }
  }

  applySessionUI();
}

function applySessionUI() {
  const buttons = document.querySelectorAll(".button-login");
  if (!buttons.length) return;

  const user = window.auth.currentUser;

  buttons.forEach((btn) => {
    if (user) {
      btn.textContent = "Cerrar sesión";
      btn.onclick = async () => {
        await signOut(window.auth);
        window.location.replace("/");
      };
    } else {
      btn.textContent = "Iniciar sesión";
      btn.onclick = () => window.location.replace("/login.html");
    }
  });

  console.log("botones actualizados →", buttons.length);
}