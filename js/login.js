// login.js
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";

const emailInput    = document.getElementById("login-email");
const passwordInput = document.getElementById("login-password");
const btnLogin = document.getElementById("btn-submit-login");
const alertEl       = document.getElementById("login-alert");

btnLogin?.addEventListener("click", async () => {
  const email    = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (!email || !password) {
    showAlert("Completa todos los campos.");
    return;
  }

  try {
    // 1. Autenticar con Firebase Auth
    const { user } = await signInWithEmailAndPassword(window.auth, email, password);
    console.log("Auth OK →", user.email);

    // 2. Verificar que existe en colección admins
    const snap = await getDoc(doc(window.db, "admins", user.uid));

    if (!snap.exists() || snap.data().rol !== "admin") {
      console.log("No es admin → denegado");
      await window.auth.signOut();
      showAlert("No tienes permisos de administrador.");
      return;
    }

    console.log("Admin verificado →", snap.data().nombre);
    // 3. Redirigir — onAuthStateChanged en auth.js se encargará del resto
    window.location.replace("/admin.html");

  } catch (err) {
    console.error("login error →", err.code);
    showAlert(friendlyError(err.code));
  }
});

function showAlert(msg) {
  alertEl.textContent = msg;
  alertEl.style.display = "block";
}

function friendlyError(code) {
  const errors = {
    "auth/user-not-found":   "Usuario no encontrado.",
    "auth/wrong-password":   "Contraseña incorrecta.",
    "auth/invalid-email":    "Correo inválido.",
    "auth/too-many-requests":"Demasiados intentos. Espera un momento.",
  };
  return errors[code] ?? "Error al iniciar sesión.";
}