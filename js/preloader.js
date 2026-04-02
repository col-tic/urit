// preloader.js
// Controla el preloader: bloquea scroll al inicio, lo libera al ocultar.
// Mínimo 1s visible, timeout forzado a 5s.

const MIN_MS = 1000;
const MAX_MS = 5000;

const preloader = document.getElementById("preloader");
const startTime = Date.now();

// Bloquear scroll inmediatamente
document.body.classList.add("preloader-active");

// Timeout de seguridad — oculta por fuerza a los 5s
const forceHide = setTimeout(hide, MAX_MS);

export function hide() {
  clearTimeout(forceHide);

  const elapsed   = Date.now() - startTime;
  const remaining = Math.max(0, MIN_MS - elapsed);

  setTimeout(() => {
    preloader?.classList.add("hidden");
    document.body.classList.remove("preloader-active");

    // Remover del DOM tras la transición (0.5s definida en CSS)
    preloader?.addEventListener("transitionend", () => {
      preloader.remove();
    }, { once: true });
  }, remaining);
}