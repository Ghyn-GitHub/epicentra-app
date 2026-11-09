# Epicentra
- [Epicentra APP (GitHub Pages)](https://ghyn-github.github.io/epicentra-app/)

Epicentra es una aplicación web para explorar terremotos recientes en un mapa interactivo. Permite consultar la actividad sísmica publicada por el Servicio Geológico de Estados Unidos (USGS), filtrar los eventos por fecha y magnitud, y guardar terremotos como favoritos con una cuenta de usuario.

## Funcionalidades

- **Mapa interactivo:** muestra los terremotos como marcadores y permite consultar sus detalles en ventanas emergentes.
- **Datos sísmicos del USGS:** al abrir la página se carga el feed de terremotos de las últimas 24 horas. También se pueden consultar eventos mediante los filtros de fecha y magnitud mínima.
- **Marcadores por magnitud:** el tamaño y el color de los marcadores representan la magnitud. Las tarjetas de favoritos muestran también su clasificación.
- **Favoritos por cuenta:** es posible guardar y quitar terremotos de favoritos. La lista muestra la magnitud, la ubicación, la fecha y el código del evento; desde cada tarjeta se puede centrar el mapa en el terremoto o eliminarlo de la lista.
- **Registro e inicio de sesión:** la autenticación se realiza con Firebase Authentication y correo electrónico y contraseña.
- **Tema claro y oscuro:** el tema seleccionado se guarda en el `localStorage` del navegador y se conserva entre la página del mapa y la de acceso. La capa cartográfica también cambia con el tema. Esta preferencia es local al navegador y no se sincroniza entre dispositivos ni cuentas.
- **Estados de carga y errores:** se muestra un indicador de carga al consultar el mapa. La aplicación informa si no se puede completar una operación de favoritos.

## Tecnologías y servicios

- HTML, CSS y JavaScript con módulos ES.
- [Leaflet 1.9.4](https://leafletjs.com/) para el mapa.
- [Stadia Maps](https://stadiamaps.com/) y datos cartográficos de OpenStreetMap/OpenMapTiles para las capas clara y oscura.
- [USGS Earthquake Hazards Program](https://earthquake.usgs.gov/) para los datos sísmicos en formato GeoJSON.
- [Firebase Authentication](https://firebase.google.com/docs/auth) para el registro y el inicio de sesión.
- [Cloud Firestore](https://firebase.google.com/docs/firestore) para guardar los favoritos.

Las bibliotecas y servicios externos se cargan desde sus URL en el navegador. El repositorio no incluye un sistema de compilación ni un gestor de dependencias.

## Requisitos

- Un navegador moderno.
- Conexión a Internet para cargar Leaflet, los mapas, los datos del USGS y Firebase.
- Un proyecto de Firebase con **Authentication** (proveedor de correo electrónico y contraseña) y **Cloud Firestore** habilitados para utilizar el registro, el inicio de sesión y los favoritos.
- Un servidor web local para servir los archivos. Al usar módulos JavaScript, no abras `index.html` directamente con `file://`.

## Ejecución local

1. Clona el repositorio o descarga sus archivos.
2. Abre la carpeta del proyecto con un servidor web local. Por ejemplo, con la extensión **Live Server** de Visual Studio Code, abre `index.html` y selecciona **Open with Live Server**. La configuración incluida en `.vscode/settings.json` establece el puerto `5501`.
3. Abre la dirección local que indique el servidor, normalmente `http://127.0.0.1:5501/`.

No hay un comando `npm install` o `npm run`: el proyecto no contiene `package.json` y no requiere un paso de compilación.

## Configuración de Firebase

La conexión se inicializa en `js/firebase.js`. El archivo contiene la configuración de cliente de Firebase del proyecto `epicentra-app`. Si vas a ejecutar una copia con tu propio proyecto de Firebase:

1. Crea un proyecto en Firebase.
2. Añade una aplicación web y copia su configuración de Firebase en `js/firebase.js`.
3. En **Authentication**, habilita el proveedor de correo electrónico y contraseña.
4. Crea una base de datos de **Cloud Firestore**.
5. Configura reglas de Firestore que permitan a cada usuario acceder únicamente a sus propios favoritos.

Los documentos de favoritos usan esta ruta:

```text
users/{uid}/favorites/{eventCode}
```

Cada documento guarda el código, título, magnitud, fecha del evento y coordenadas (`code`, `title`, `magnitude`, `time`, `lat`, `lng`). Las reglas de seguridad de Firestore no están incluidas en este repositorio; deben configurarse en Firebase antes de habilitar favoritos en una publicación propia.

La configuración web de Firebase se utiliza en el cliente. No incluyas claves privadas de cuentas de servicio en el código del navegador.

## Uso

1. Abre Epicentra para ver los terremotos recientes en el mapa.
2. Introduce una magnitud mínima o una fecha de inicio y/o fin para actualizar los resultados. Si la fecha inicial es posterior a la final, la aplicación muestra un aviso.
3. Selecciona un marcador para consultar la información del terremoto.
4. Para guardar o consultar favoritos, crea una cuenta o inicia sesión y usa la pestaña **Favoritos**. Puedes volver a un evento desde su tarjeta o quitarlo de tus favoritos.
5. Usa el control del encabezado para alternar entre el tema claro y el oscuro.

## Estructura del proyecto

```text
.
├── index.html        # Página principal, filtros, pestañas y mapa
├── login.html        # Registro e inicio de sesión
├── css/
│   ├── style.css     # Estilos de la aplicación y el mapa
│   └── login.css     # Estilos de la página de acceso
├── js/
│   ├── script.js     # Mapa, consulta de datos, filtros y favoritos
│   ├── auth.js       # Registro e inicio de sesión
│   ├── firebase.js   # Inicialización de Firebase
│   └── theme.js      # Cambio y persistencia local del tema
└── .vscode/
    └── settings.json # Puerto de Live Server (5501)
```

## Fuentes y atribución

- Los datos sísmicos se consultan en los feeds y servicios GeoJSON del [USGS](https://earthquake.usgs.gov/).
- La cartografía utiliza capas de [Stadia Maps](https://stadiamaps.com/) y atribuye a [OpenStreetMap](https://www.openstreetmap.org/copyright) y OpenMapTiles, tal como requiere la capa utilizada.

La disponibilidad de los datos, mapas y funciones de Firebase depende de los servicios externos y de su configuración.
