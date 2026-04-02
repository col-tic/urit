import { Html5Qrcode } from "https://esm.sh/html5-qrcode";
import QRCode from "https://esm.sh/qrcode";

export function createQrScanner(elementId, onSuccess, onError) {
  const scanner = new Html5Qrcode(elementId);

  async function start() {
    const devices = await Html5Qrcode.getCameras();
    if (!devices.length) throw new Error("No camera");

    let cam = devices.find(d =>
      /back|rear|environment/i.test(d.label)
    );

    if (!cam) cam = devices[devices.length - 1];

    await scanner.start(
      cam.id,
      { fps: 10, qrbox: { width: 250, height: 250 } },
      onSuccess,
      onError
    );
  }

  async function stop() {
    try {
      await scanner.stop();
      await scanner.clear();
    } catch (e) {
      console.warn("stop scanner:", e);
    }
  }

  return { start, stop };
}

export async function createQr(text) {
  return await QRCode.toDataURL(text);
}