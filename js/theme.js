// Recuperar el tema guardado
const savedTheme = localStorage.getItem("theme");

// Aplicar el tema guardado
if (savedTheme === "dark") {
  document.documentElement.classList.add("dark-mode");
}

// Obtener el interruptor
const themeToggle = document.getElementById("theme-toggle");

// Cambiar el tema al pulsar el interruptor
themeToggle.addEventListener("click", () => {
  document.documentElement.classList.toggle("dark-mode");

  // Guardar la preferencia
  const currentTheme = document.documentElement.classList.contains("dark-mode")
    ? "dark"
    : "light";

  localStorage.setItem("theme", currentTheme);
});
