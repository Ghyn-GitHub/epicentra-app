import { auth, db } from "./firebase.js";
import "./theme.js";
import {
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js";
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
} from "https://www.gstatic.com/firebasejs/13.1.0/firebase-firestore.js";
//--------------------------------------------------------

const authContainer = document.getElementById("auth-container");

onAuthStateChanged(auth, (user) => {
  if (user) {
    loadFavorites(user);

    document.getElementById("favorites-empty").hidden = true;
    document.getElementById("favorites-no-results").hidden =
      favoriteEarthquakes.size > 0;

    authContainer.innerHTML = `
        <span>
          <svg class="user-icon" 
              xmlns="http://www.w3.org/2000/svg"width="25"height="25"
              viewBox="0 0 24 24"fill="none"stroke="currentColor"
              stroke-width="2"stroke-linecap="round"stroke-linejoin="round"
              aria-hidden="true">
              <circle cx="12" cy="8" r="4"/>
              <path d="M5 21v-2a7 7 0 0 1 14 0v2"/>
          </svg>
          ${user.email.split("@")[0]}
        </span>
        <button id="logout-button" type="button" aria-label="Cerrar sesión" data-tooltip="Cerrar sesión">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"
                viewBox="0 0 24 24" fill="none" stroke="currentColor"
                stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
        </button>
        `;

    document
      .getElementById("logout-button")
      .addEventListener("click", async () => {
        await signOut(auth);
      });
  } else {
    // Con los clear y el render limpio la lista de favs que persistía al cerrar sesión. Después del signOut me hubiera funcionado también pero hubiese sido dependiente del botón de logout.
    favorites.clear();
    favoriteEarthquakes.clear();
    renderFavorites();

    document.getElementById("favorites-empty").hidden = false;
    document.getElementById("favorites-no-results").hidden = true; // Cuando no hay usuario oculta el mensaje de lista vacía.

    authContainer.innerHTML = '<a href="./login.html">Acceder</a>';
  }
});

// favorites va a almacenar solo los códigos, no permite duplicados y se usa para comprobar si un terremoto está guardado. favoriteEarthquakes contiene los datos completos.
const favorites = new Set();
const favoriteEarthquakes = new Map();

// Integración del mapa
var map = L.map("map").setView([0, 0], 2);

var Stadia_AlidadeSmooth = L.tileLayer(
  "https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.{ext}",
  {
    minZoom: 0,
    maxZoom: 20,
    attribution:
      '&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    ext: "png",
  },
);

var Stadia_AlidadeSmoothDark = L.tileLayer(
  "https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.{ext}",
  {
    minZoom: 0,
    maxZoom: 20,
    attribution:
      '&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    ext: "png",
  },
);

// Seleccionar la capa según el tema actual
var currentMapLayer = document.documentElement.classList.contains("dark-mode")
  ? Stadia_AlidadeSmoothDark
  : Stadia_AlidadeSmooth;

// Añadir la capa seleccionada al mapa
currentMapLayer.addTo(map);

// Cambiar la capa del mapa al cambiar el tema
document.getElementById("theme-toggle").addEventListener("click", () => {
  map.removeLayer(currentMapLayer);

  currentMapLayer = document.documentElement.classList.contains("dark-mode")
    ? Stadia_AlidadeSmoothDark
    : Stadia_AlidadeSmooth;

  currentMapLayer.addTo(map);
});

// Leaflet Groups
const earthquakeLayer = L.layerGroup().addTo(map);

// Listener para los popups. Gestiona los clicks. Leaflet proporciona los parámetros tipo "map.on", "popupopen", "event.popup".
map.on("popupopen", (event) => {
  const popup = event.popup.getElement();
  const favoriteButton = popup.querySelector(".favorite-button");

  if (!favoriteButton) return; // Comprueba si hemos encontrado el botón de fav. No todos los popups tienen botón de fav, de ahí su utilidad.

  // Si no hay usuario elimina el botón de fav
  if (!auth.currentUser) {
    favoriteButton.remove();
    return;
  }

  const code = favoriteButton.dataset.code;
  const star = favoriteButton.querySelector("svg");
  const isFavorite = favorites.has(code);

  // Al abrir el popup, actualiza la estrella según el estado guardado.
  star.setAttribute("fill", isFavorite ? "#FACC15" : "none");

  // Cambia el texto del tooltip
  favoriteButton.dataset.tooltip = isFavorite
    ? "Quitar de favoritos"
    : "Guardar en favoritos";

  // Accesibilidad para los lectores de pantalla
  favoriteButton.setAttribute("aria-label", favoriteButton.dataset.tooltip);

  favoriteButton.onclick = async () => {
    // Pequeña capa de seguridad por si no hay usuario y se consigue pulsar el botón de fav, de esta forma te lleva al login. Inicialmente no debería porque se oculta arriba, pero por si acaso.
    if (!auth.currentUser) {
      window.location.href = "./login.html";
      return;
    }

    const code = favoriteButton.dataset.code;
    const isFavorite = favorites.has(code);
    const user = auth.currentUser;
    const favoriteRef = doc(db, "users", user.uid, "favorites", code);

    try {
      // Añade o elimina el terremoto de favoritos
      if (isFavorite) {
        // Primero elimina el doc de Firestore
        await deleteDoc(favoriteRef);

        // Si sale bien actualiza la data local
        favorites.delete(code);
        favoriteEarthquakes.delete(code);
      } else {
        const earthquake = {
          code: code,
          title: favoriteButton.dataset.title,
          magnitude: favoriteButton.dataset.magnitude,
          time: favoriteButton.dataset.time,
          lat: favoriteButton.dataset.lat,
          lng: favoriteButton.dataset.lng,
        };

        // Guarda primero un docu en Firestore con la ubicación(Ref) y los datos. Adicionalmente setDoc() actualiza el docu y evita el dupe.
        await setDoc(favoriteRef, earthquake);

        // Si sale bien actualiza local
        favorites.add(code);
        favoriteEarthquakes.set(code, earthquake);
      }

      renderFavorites(); // Pinta los favs on click

      const star = favoriteButton.querySelector("svg");

      // Tras hacer clic, actualiza la estrella según el nuevo estado.
      star.setAttribute("fill", favorites.has(code) ? "#FACC15" : "none");
    } catch (error) {
      console.error("Error al actualizar los favoritos:", error);
      alert("No se ha podido actualizar el favorito. Inténtalo de nuevo.");
    }
  };
});

// Lógica "cargando..."
function showLoading() {
  document.getElementById("map").classList.add("loading");
  document.getElementById("loading").style.display = "block";
}
function hideLoading() {
  document.getElementById("map").classList.remove("loading");
  document.getElementById("loading").style.display = "none";
}

// Simplifica la inicialización en los listeners de los filtros para mostrar y ocultar los loadings.
function applyFilters() {
  // Check para que la fecha de inicio sea anterior
  const startDate = document.getElementById("start-date").value;
  const endDate = document.getElementById("end-date").value;

  if (startDate && endDate && startDate > endDate) {
    alert("Introduce una fecha inicial anterior a la fecha final.");
    return;
  }
  //-----------------------------------------------

  showLoading();
  getDataFiltered()
    .then((data) => paintData(data))
    .finally(() => hideLoading());
}

// Llamada a los terremotos del último día
async function getDataYesterday() {
  try {
    // Placeholder para showLoading y hideLoading
    document.getElementById("loading").innerHTML = "";

    const res = await fetch(
      "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson",
    );
    const data = await res.json();
    document.getElementById("loading").innerHTML = ""; // Oculta "cargando..."
    return data;
  } catch (e) {
    console.log(e);
  }
}

// Llamada a los terremotos filtrados
async function getDataFiltered() {
  const startTime = document.getElementById("start-date").value;
  const endTime = document.getElementById("end-date").value;
  const minMag = document.getElementById("magnitude").value;

  let url = "https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson";

  if (startTime) {
    url += `&starttime=${startTime}`;
  }

  if (endTime) {
    url += `&endtime=${endTime}`;
  }

  if (minMag) {
    url += `&minmagnitude=${minMag}`;
  }

  try {
    const res = await fetch(url);
    const data = await res.json();
    return data;
  } catch (e) {
    console.log(e);
  }
}

// Devuelve la información de color y clasificación según la magnitud
function getMagnitudeInfo(mag) {
  if (mag < 2) {
    return {
      color: "#168A35",
      label: "Baja",
      tagBackground: "#168A35",
      tagColor: "#FFFFFF",
    };
  } else if (mag < 3) {
    return {
      color: "#75A92A",
      label: "Baja",
      tagBackground: "#75A92A",
      tagColor: "#FFFFFF",
    };
  } else if (mag < 4) {
    return {
      color: "#F2DC24",
      label: "Moderada",
      tagBackground: "#F2DC24",
      tagColor: "#FFFFFF",
    };
  } else if (mag < 5) {
    return {
      color: "#F5A623",
      label: "Moderada",
      tagBackground: "#F5A623",
      tagColor: "#FFFFFF",
    };
  } else if (mag < 6) {
    return {
      color: "#E94B27",
      label: "Alta",
      tagBackground: "#E94B27",
      tagColor: "#FFFFFF",
    };
  } else if (mag < 7) {
    return {
      color: "#D71920",
      label: "Alta",
      tagBackground: "#D71920",
      tagColor: "#FFFFFF",
    };
  } else {
    return {
      color: "#171717",
      label: "Extrema",
      tagBackground: "#171717",
      tagColor: "#FFFFFF",
    };
  }
}

// Asigna color al pin según la magnitud
function getColor(mag) {
  return getMagnitudeInfo(mag).color;
}

// Construye el contenido de los popups de terremotos
function createEarthquakePopup(earthquake) {
  return `
        <div class="earthquake-popup">
            <div class="earthquake-popup-info">
                <strong>${earthquake.title}</strong>
            </div>

            <button
                class="favorite-button"
                type="button"
                data-code="${earthquake.code}"
                data-title="${earthquake.title}"
                data-magnitude="${earthquake.magnitude}"
                data-time="${earthquake.time}"
                data-lat="${earthquake.lat}"
                data-lng="${earthquake.lng}"
                aria-label="Guardar en favoritos"
                data-tooltip="Guardar en favoritos"
            >
                <svg
                    viewBox="0 0 24 24"
                    width="24"
                    height="24"
                    fill="${favorites.has(earthquake.code) ? "#FACC15" : "none"}"
                    stroke="#404040"
                    stroke-width="1.8"
                    stroke-linejoin="round"
                >
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
            </button>
        </div>
    `;
}

// Pinta los marcadores en los mapas
function paintData(data) {
  earthquakeLayer.clearLayers();

  data.features.forEach((pin) => {
    const title = pin.properties.title;
    const time = pin.properties.time;
    const coordinates = [
      pin.geometry.coordinates[1],
      pin.geometry.coordinates[0],
    ];
    const code = pin.properties.code;
    const mag = pin.properties.mag;

    // Añadir marcadores
    const marker = L.circleMarker(coordinates, {
      color: getColor(mag),
      fillOpacity: 0.5,
      radius: 6 + mag * 2,
    })
      .bindPopup(
        createEarthquakePopup({
          title: title,
          code: code,
          magnitude: mag,
          time: time,
          lat: coordinates[0],
          lng: coordinates[1],
        }),
      )
      .addTo(earthquakeLayer);
  });
}

// Pinta la lista de favs
function renderFavorites() {
  const favoritesList = document.getElementById("favorites-list");
  const favoritesHeader = document.getElementById("favorites-header");
  const favoritesCount = document.getElementById("favorites-count");

  // Actualiza el contador y muestra el encabezado si hay sesión
  favoritesCount.textContent = favoriteEarthquakes.size;
  favoritesHeader.hidden = !auth.currentUser;

  favoritesList.innerHTML = "";

  // Lógica de favoritos vacío
  const noResults = document.getElementById("favorites-no-results");
  noResults.hidden = favoriteEarthquakes.size > 0;

  favoriteEarthquakes.forEach((earthquake) => {
    const item = document.createElement("div");
    item.classList.add("favorite-item");

    const header = document.createElement("div");
    header.classList.add("favorite-item-header");

    const magnitude = document.createElement("strong");
    magnitude.classList.add("favorite-item-magnitude");
    magnitude.textContent = `M ${Number(earthquake.magnitude).toFixed(2)}`;

    const magnitudeInfo = getMagnitudeInfo(earthquake.magnitude);

    const magTag = document.createElement("span");
    magTag.classList.add("favorite-item-magtag");
    magTag.textContent = `Magnitud ${magnitudeInfo.label}`;
    magTag.style.backgroundColor = magnitudeInfo.tagBackground;
    magTag.style.color = magnitudeInfo.tagColor;

    const location = document.createElement("p");
    location.classList.add("favorite-item-location");
    location.textContent = earthquake.title;

    const date = document.createElement("span");
    date.classList.add("favorite-item-date");
    // Convierte el timestamp de la USGS en una fecha legible, con formato español. Ej: 31/10/2026, 17:33.
    date.textContent = new Date(Number(earthquake.time)).toLocaleString(
      "es-Es",
      {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      },
    );

    const divider = document.createElement("hr");
    divider.classList.add("favorite-item-divider");

    const footer = document.createElement("div");
    footer.classList.add("favorite-item-footer");

    const code = document.createElement("span");
    code.classList.add("favorite-item-code");
    code.textContent = `Código: ${earthquake.code}`;

    const actions = document.createElement("div");
    actions.classList.add("favorite-item-actions");

    const mapButton = document.createElement("button");
    mapButton.classList.add("favorite-item-map");
    mapButton.type = "button";
    mapButton.innerHTML = `
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
            >
                <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/>
                <circle cx="12" cy="10" r="2.5"/>
            </svg>
            <span>Ver en el mapa</span>
        `;
    mapButton.addEventListener("click", () => {
      const lat = Number(earthquake.lat);
      const lng = Number(earthquake.lng);

      map.setView([lat, lng], 7);

      L.popup()
        .setLatLng([lat, lng])
        .setContent(createEarthquakePopup(earthquake))
        .openOn(map);
    });

    const deleteButton = document.createElement("button");
    deleteButton.classList.add("favorite-item-delete");
    deleteButton.type = "button";
    deleteButton.setAttribute("aria-label", "Eliminar de favoritos");
    deleteButton.dataset.code = earthquake.code;
    deleteButton.addEventListener("click", async () => {
      const code = deleteButton.dataset.code;
      const user = auth.currentUser;

      if (!user) return;

      const favoriteRef = doc(db, "users", user.uid, "favorites", code);

      try {
        await deleteDoc(favoriteRef);

        favorites.delete(code);
        favoriteEarthquakes.delete(code);

        // Busca el fav button del popup
        const favoriteButton = document.querySelector(
          `.favorite-button[data-code="${code}"]`,
        );
        // Vacía su relleno
        if (favoriteButton) {
          const star = favoriteButton.querySelector("svg");
          star.setAttribute("fill", "none");
        }

        renderFavorites();
      } catch (error) {
        console.error("Error al eliminar el favorito:", error);
        alert("No se ha podido eliminar el favorito. Inténtalo de nuevo.");
      }
    });
    deleteButton.innerHTML = `
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
            >
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6l-1 14H6L5 6"/>
                <path d="M10 11v6"/>
                <path d="M14 11v6"/>
                <path d="M9 6V4h6v2"/>
            </svg>
        `;

    header.append(magnitude, magTag);
    actions.append(mapButton, deleteButton);
    footer.append(code, actions);
    item.append(header, location, date, divider, footer);
    favoritesList.appendChild(item);
  });
}

// Consulta Firestore y reconstruye las estructuras locales de "favorites" y "favoriteEarthquakes".
async function loadFavorites(user) {
  const favoritesRef = collection(db, "users", user.uid, "favorites");

  // Descarga los docus de la colección
  const snapshot = await getDocs(favoritesRef);

  // Vacía los datos locales
  favorites.clear();
  favoriteEarthquakes.clear();

  // Reconstruye las estructuras locales
  snapshot.forEach((favoriteDoc) => {
    const earthquake = favoriteDoc.data();

    favorites.add(earthquake.code);

    favoriteEarthquakes.set(earthquake.code, {
      code: earthquake.code,
      title: earthquake.title,
      magnitude: earthquake.magnitude,
      time: earthquake.time,
      lat: earthquake.lat,
      lng: earthquake.lng,
    });
  });

  renderFavorites(); // Actualiza favs
}

// Muestra el dataYesterday con el loading, luego lo oculta.
showLoading();

getDataYesterday()
  .then((data) => paintData(data))
  .finally(() => hideLoading());

// Inicializar la lista y configurar los filtros
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("magnitude").addEventListener("change", applyFilters);

  document
    .getElementById("start-date")
    .addEventListener("change", applyFilters);

  document.getElementById("end-date").addEventListener("change", applyFilters);

  document.getElementById("close-info").addEventListener("click", () => {
    document.getElementById("map-info").style.display = "none";
  });

  setTimeout(() => {
    document.getElementById("map-info").style.display = "none";
  }, 8000);

  // Cambiar entre las pestañas Filtros y Favoritos
  const filtersTab = document.getElementById("filters-tab");
  const favoritesTab = document.getElementById("favorites-tab");

  const filtersPanel = document.getElementById("filters-panel");
  const favoritesPanel = document.getElementById("favorites-panel");

  filtersTab.addEventListener("click", () => {
    filtersTab.classList.add("active");
    favoritesTab.classList.remove("active");

    filtersPanel.hidden = false;
    favoritesPanel.hidden = true;
  });

  favoritesTab.addEventListener("click", () => {
    favoritesTab.classList.add("active");
    filtersTab.classList.remove("active");

    favoritesPanel.hidden = false;
    filtersPanel.hidden = true;
  });
});
