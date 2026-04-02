// qrRender.js — helper compartido
// Recibe nombre, subtítulo e imagen base64 y los inyecta en el partial generate-qr.html

export function renderQr(nombre, sub, imgSrc) {
  const card = document.getElementById("qr-card");
  const name = document.getElementById("qr-name");
  const subEl = document.getElementById("qr-sub");
  const img  = document.getElementById("qr-img");

  if (!card || !name || !subEl || !img) {
    console.warn("qrRender: elementos del partial no encontrados");
    return;
  }

  name.textContent = nombre;
  subEl.textContent = sub ?? "";
  img.src          = imgSrc;
  img.alt          = `QR de ${nombre}`;
  card.style.display = "block";
}