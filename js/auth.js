import { auth } from "./firebase.js";
import "./theme.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js";

const authForm = document.getElementById("auth-form");
const formTitle = document.getElementById("form-title");
const formDescription = document.getElementById("form-description");
const authSubmit = document.getElementById("auth-submit");
const authSwitchText = document.getElementById("auth-switch-text");
const authToggle = document.getElementById("auth-toggle");
const authMessage = document.getElementById("auth-message");
const email = document.getElementById("email");
const password = document.getElementById("password");

let isRegistering = false;

document.getElementById("auth-toggle").addEventListener("click", () => {
  isRegistering = !isRegistering;
  if (isRegistering) {
    formTitle.textContent = "Crear cuenta nueva";
    formDescription.textContent =
      "Crea una cuenta para acceder a nuevas funciones.";
    authSubmit.textContent = "Crear cuenta";
    authSwitchText.textContent = "¿Ya tienes cuenta?";
    authToggle.textContent = "Iniciar sesión";
  } else {
    formTitle.textContent = "Accede a tu cuenta";
    formDescription.textContent = "Bienvenido de nuevo a Epicentra.";
    authSubmit.textContent = "Iniciar sesión";
    authSwitchText.textContent = "¿No tienes cuenta?";
    authToggle.textContent = "Crear cuenta";
  }
});

authForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const emailValue = email.value;
  const passwordValue = password.value;

  try {
    if (isRegistering) {
      await createUserWithEmailAndPassword(auth, emailValue, passwordValue);
    } else {
      await signInWithEmailAndPassword(auth, emailValue, passwordValue);
    }
    // Redirigir a index.html
    window.location.href = "./index.html";
  } catch (error) {
    authMessage.textContent = error.message;
  }
});
