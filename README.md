# Simulación de phishing mediante QR — Campus SJ

## 1. Descripción del proyecto

Simulación educativa desarrollada para el curso **Seguridad Computacional**. La página imita un formulario de inscripción para registrar la experiencia de los estudiantes en el campus SJ y utiliza un código QR para medir cuántas personas acceden y cuántas envían datos.

**Importante:** el formulario no envía ni guarda nombres, números de alumno, carreras, respuestas ni selecciones. Solo se incrementan contadores anónimos de escaneos y envíos.

## 2. Demo

- Sitio publicado: <https://washaaaan.github.io/OpinionCampusSJ/>
- Generador de QR: <https://washaaaan.github.io/OpinionCampusSJ/qr.html>
- QR para imprimir:
  - `docs/qr-campus-sj.png` (1600 × 1600 px)
  - `docs/qr-campus-sj.svg` (vectorial)

## 3. Cómo funciona

1. El código QR abre la página principal.
2. Al cargar el formulario se incrementa el contador `escaneos` (una vez por sesión).
3. El usuario completa los campos obligatorios y presiona **Enviar**.
4. Se valida el formulario, se muestra el mensaje de simulación y se incrementa el contador `datos`.
5. El contenido de los campos permanece únicamente en el navegador: no se envía ni se guarda.
6. Los contadores se consultan y actualizan mediante la API de Tallywire.

El campo **Número de alumno** acepta cualquier texto, por ejemplo `-J`.

## 4. Estructura del repositorio

```text
.
├── docs/
│   ├── index.html          # Formulario y pantalla de resultado
│   ├── styles.css          # Estilos tipo Google Forms
│   ├── app.js              # Validación, contadores y reintentos
│   ├── qr.html             # Generador y descarga del QR
│   ├── qr-campus-sj.png    # QR en PNG
│   ├── qr-campus-sj.svg    # QR en SVG
│   └── vendor/
│       └── qrcode.js       # Librería local para generar QR
├── .gitignore
├── .counter-admin-keys.txt # Token local, no versionado
└── README.md
```

## 5. Dependencias

- **No hay proceso de build ni dependencias obligatorias.** El proyecto usa HTML, CSS y JavaScript puro.
- Navegador moderno con soporte para `fetch`, `AbortController` y `Promise`.
- **Python 3** (opcional) para ejecutar un servidor local.
- **Node.js/npm** (opcional) solo para regenerar el QR.
- La librería QR está incluida localmente en `docs/vendor/qrcode.js` (licencia MIT).

## 6. Ejecutar la demo localmente

Desde la raíz del repositorio:

```powershell
cd docs
python -m http.server 8000
```

Abrir en el navegador:

```text
http://localhost:8000
```

Los contadores son reales: abrir la página incrementa `escaneos`. Para probar sin afectar la medición, usar un namespace de prueba o reiniciar los contadores al terminar.

## 7. Reproducir el resultado principal

1. Abrir el formulario en el navegador.
2. Completar los campos obligatorios:
   - Nombre y Apellido.
   - Número de alumno (acepta cualquier texto, por ejemplo `-J`).
   - Carrera.
   - Años en el campus.
   - Las tres escalas de 1 a 5.
   - Respuesta sobre qué cambiaría del campus.
3. Presionar **Enviar**.
4. Verificar que aparece el mensaje de simulación y, debajo, los contadores:

> Esto era una simulación realizada para el curso "Seguridad Computacional", para investigar cuántas personas caen en Phishing mediante escaneo de códigos QR y cuántos efectivamente ceden sus datos. Tus datos no fueron enviados ni guardados, el fin solamente era ese

5. Abrir DevTools → **Network** y confirmar que no se envía ningún dato del formulario. Solo deben aparecer peticiones anónimas a `tallywire.cronpulse.workers.dev`.
6. Los contadores pueden mostrar `…` durante un instante y luego actualizarse con el valor real.

## 8. Contadores

- Servicio: **Tallywire**
- Namespace: `seguridadcomp-sj`
- Claves: `escaneos` y `datos`
- Límite del servicio: 600 peticiones por minuto por IP.

### Consultar sin abrir el formulario

Escanearon el QR:

```text
https://tallywire.cronpulse.workers.dev/get/seguridadcomp-sj/escaneos
```

Cedieron sus datos:

```text
https://tallywire.cronpulse.workers.dev/get/seguridadcomp-sj/datos
```

### Ver estadísticas

```text
https://tallywire.cronpulse.workers.dev/s/seguridadcomp-sj/escaneos
https://tallywire.cronpulse.workers.dev/s/seguridadcomp-sj/datos
```

Las URLs de consulta y estadísticas no incrementan los contadores.
