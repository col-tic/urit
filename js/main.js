// main.js
import "./header.js";
import { hide as hidePreloader } from "./preloader.js";
import { getAuthState } from "./auth.js";
import { handleSession } from "./onSession.js";

const isLoggedIn = await getAuthState();
handleSession(isLoggedIn);
hidePreloader(); // ← Firebase resolvió, ahora sí

const page = document.body.dataset.page;
if (page === "login")  import("./login.js");
if (page === "admin")  import("./admin.js");
if (page === "_index") {
  import("./createQr.js?v=4");
  import("./register.js?v=4");
}