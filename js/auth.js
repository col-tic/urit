// auth.js
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";

export function getAuthState() {
  return new Promise((resolve) => {
    if (!window.auth) {
      console.error("auth.js: window.auth no definido");
      resolve(false);
      return;
    }
    const unsub = onAuthStateChanged(window.auth, (user) => {
      unsub();
      console.log("auth.js → usuario:", user?.email ?? "ninguno");
      resolve(!!user);
    });
  });
}

export function getCurrentUser() {
  return window.auth?.currentUser ?? null;
}

export async function logout() {
  await signOut(window.auth);
  window.location.replace("/");
}