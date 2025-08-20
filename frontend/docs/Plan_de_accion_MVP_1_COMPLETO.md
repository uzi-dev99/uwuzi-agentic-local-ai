# Plan de Acción v4: MVP de Chatbot Multimodal

## Introducción Estratégica

**Objetivo del Documento:** Este plan de acción define las tareas necesarias para construir la primera versión funcional y robusta (**MVP - Producto Mínimo Viable**) de la aplicación Wuzi.

### Enfoque del MVP (V1): El Chatbot Local Multimodal

Tras un análisis detallado, hemos decidido centrar este MVP en una única funcionalidad clave: un **chatbot local de alto rendimiento con capacidades multimodales (texto, imagen y audio)**. La arquitectura se simplifica para lograr este objetivo de la manera más directa y eficiente posible:

  * **Comunicación Directa:** El frontend se comunicará con un endpoint específico del backend (`/api/v1/chat/direct`) que actúa como un "proxy inteligente" hacia el modelo Gemma alojado en Ollama.
  * **Sin Complejidad Agencial:** Se elimina la necesidad de un enrutador o clasificador de intenciones en el backend. La lógica es simple: recibir la petición, formatearla para Ollama y devolver la respuesta.
  * **Control del Usuario:** El frontend dispondrá de un "switch" que permitirá al usuario estar en "Modo Chat". Esto nos da el control explícito y evita ambigüedades.

### Visión a Futuro (V2): El Modo Agente

Este MVP es la base fundamental sobre la cual se construirá la versión 2. La V2 introducirá el **"Modo Agente"**, que se activará a través del mismo "switch" en el frontend y llamará a un endpoint diferente (`/api/v1/agent/invoke`). Esta futura versión contendrá toda la complejidad y potencia adicional, incluyendo:

  * Workflows con n8n.
  * Lógica de RAG (Retrieval-Augmented Generation).
  * Conexión a bases de datos como PostgreSQL.
  * Capacidades agenciales avanzadas.

Al separar claramente estas dos fases, aseguramos una entrega rápida y de alta calidad del producto principal, mientras sentamos las bases para una evolución escalable y ordenada.

-----

## Fase 1: Backend - El Proxy Inteligente

**Objetivo:** Crear un backend que reciba las peticiones del frontend, las formatée correctamente para la API de Ollama y devuelva la respuesta.

### 1.1. Estructura y Configuración

  * **[x] Definir Modelo Base:** Identificar y cambiar todas las variables y configuraciones necesarias en el código para tomar como modelo base a `gemma3:12b`.
  * ** [x] Revisar `requirements.txt`:** Asegurar que contenga `fastapi`, `uvicorn`, `httpx`, `python-dotenv` y `python-multipart`.
      * **Nota Aclaratoria:** La librería `openai-whisper` se elimina de este servicio, ya que la transcripción de audio se delegará a un microservicio dedicado.
  * [x] Configurar `.env`:**
    ```
    OLLAMA_API_URL="http://localhost:11434/api/generate"
    MULTIMODAL_MODEL="gemma3:12b"
    WHISPER_API_URL="http://whisper-faster:8000/transcribe" # URL interna del servicio Whisper en la red de Docker
    ```
  * ** [x] Definir Endpoints en `main.py`:**
      * Crear el endpoint `POST /api/v1/chat/direct` que será el principal para este MVP.
      * Dejar un placeholder para `POST /api/v1/agent/invoke` para la futura V2.

### 1.2. Implementación de Servicios

  * ** [x] Implementar `audio_service.py` para Delegar Transcripción:**
      * Crear una función `transcribe_audio(file: UploadFile)` que:
          * No use la librería `openai-whisper` directamente.
          * Realice una petición `POST` de tipo `multipart/form-data` a la URL definida en la variable de entorno `WHISPER_API_URL`.
          * Envíe el `file` en el cuerpo de la petición.
          * Reciba la respuesta JSON del servicio Whisper y devuelva el texto transcrito.
  * [x] Implementar `chat_service.py`:**
      * Crear la función principal `generate_response` que recibirá del `main.py` el historial de mensajes (`messages`) y los archivos adjuntos (`files: List[UploadFile]`).
      * **Lógica de procesamiento:**
          * Inicializar `prompt_text` con el último mensaje del usuario.
          * Inicializar una lista vacía `base64_images = []`.
          * **Procesar Archivos:**
              * Iterar sobre los `files`.
              * Si es una imagen, convertirla a base64 y añadirla a `base64_images`.
              * Si es audio, llamar a la nueva función `audio_service.transcribe_audio(file)` para obtener el texto. Añadir este texto al `prompt_text`.
          * **Construir el Payload para Ollama:**
              * Crear un diccionario `payload`.
              * `payload['model'] = MULTIMODAL_MODEL`
              * `payload['prompt'] = prompt_text`
              * `payload['stream'] = True`
              * `payload['context'] = ...` (Aquí se aplica la estrategia de ventana deslizante simple).
              * Si `base64_images` no está vacía, añadir `payload['images'] = base64_images`.
          * **Llamar a Ollama:**
              * Hacer la petición `POST` al `OLLAMA_API_URL` con el `payload`.
              * La función debe ser un `async def` y usar `yield` para devolver el stream de respuesta.

-----

## Fase 2: Frontend - Interfaz y Comunicación

**Objetivo:** Asegurar que la interfaz pueda enviar peticiones multimodales al nuevo endpoint y renderizar la respuesta.

  * **[x] Modificar `ChatContext.tsx` o `backendService.ts`:**
      * Asegurarse de que la función que envía el mensaje (`handleSendMessage` o `invokeAgent`) ahora llame al endpoint `/api/v1/chat/direct`.
      * La función debe ser capaz de enviar `FormData` cuando haya archivos adjuntos.
      * Debe enviar tanto el historial de mensajes (como un string JSON) como los archivos.
      * La lógica para manejar la respuesta en streaming ya debería funcionar.
  * **[x] Implementar el "Switch de Modo" (Chat/Agente):**
      * En el componente de la cabecera del chat (`ChatHeader.tsx` o similar), donde está el dropdown "Mode".
      * Almacenar el modo seleccionado en un estado de React (probablemente en `ChatContext`).
      * La función `handleSendMessage` debe leer este estado. Por ahora, solo implementará la lógica para el "Modo Chat". Si el modo es "Agente", puede mostrar un mensaje temporal como "Modo Agente no disponible en esta versión".
  * **[x] Verificar la Carga de Archivos:**
      * Confirmar que el `MessageInput.tsx` permite adjuntar archivos de imagen y audio.
      * Asegurarse de que estos archivos se asocien correctamente al mensaje que se va a enviar.
Aquí tienes el texto formateado en Markdown, listo para tu agente de IA:


# Fase 3: Pulido de UX y Buenas Prácticas Móviles

**contexto:** Información Clave del Dispositivo (Xiaomi 12 Pro)
Los datos más importantes no son solo la resolución, sino cómo el navegador la interpreta. Aquí tienes los detalles cruciales:

Resolución de Pantalla (Píxeles Físicos): 1440 x 3200 píxeles.

Relevancia: Esta es la cantidad real de puntos físicos en la pantalla, lo que le da su alta definición.

Ratio de Píxeles del Dispositivo (DPR - Device Pixel Ratio): 3.0.

Relevancia: Este es un dato fundamental. Significa que por cada píxel que defines en tu CSS, el dispositivo usa una cuadrícula de 3x3 píxeles físicos para dibujarlo. Esto hace que las fuentes y las imágenes se vean súper nítidas.

Viewport Lógico (Píxeles CSS): Aproximadamente 480 x 1067 píxeles.

¡Este es el dato más importante para el agente! Se calcula dividiendo la resolución física por el DPR (1440 / 3 = 480). Este es el "ancho de pantalla" real con el que trabaja el navegador. Cuando el agente use las herramientas de desarrollador, debe emular un dispositivo con este viewport.

Tasa de Refresco: 120Hz (Adaptativa).

Relevancia: Es importante para la "Fase 3.3: Implementar Gestos Nativos". Las animaciones, como el despliegue del sidebar, deben ser fluidas y aprovechar esta alta tasa de refresco para no sentirse lentas o con saltos.

Instrucciones para tu Agente
Puedes darle a tu agente un "briefing" claro y directo como el siguiente para que trabaje en la Fase 3.

"Briefing para el Agente - Tareas de UX Móvil (Fase 3)

Por favor, realiza las siguientes tareas de pulido de la experiencia de usuario. El dispositivo de referencia principal para todas las pruebas es un Xiaomi 12 Pro.

Utiliza las herramientas de desarrollador de tu navegador para emular un dispositivo móvil con las siguientes especificaciones:

Viewport Lógico: 480px de ancho por 1067px de alto.

Device Pixel Ratio (DPR): 3.0

User Agent String: Un user agent de un móvil Android moderno con Chrome.

Tareas a realizar con este viewport:

Control de Desbordamiento (Tarea 3.1):

Verifica que ningún elemento de la UI cause un scroll horizontal en la vista principal.

En la vista de chat, genera un bloque de código largo y confirma que el desbordamiento horizontal está contenido únicamente dentro del bloque de código (<pre>), permitiendo el scroll solo en esa área sin afectar al resto de la página.

Bloqueo de Zoom (Tarea 3.1):

Asegúrate de que el gesto de "pellizcar para hacer zoom" (pinch-to-zoom) esté completamente deshabilitado en toda la aplicación. La escala debe ser fija.

Gestos Nativos (Tarea 3.3):

Implementa y prueba que el gesto de deslizar desde el borde izquierdo de la pantalla hacia la derecha abra el menú lateral. La animación debe ser fluida y responder a la velocidad del dedo, sin lag ni saltos, considerando una pantalla de 120Hz.

Botón "Atrás" (Conceptual) (Tarea 3.4):

Recuerda que la lógica que implementes para el botón "Atrás" será probada en un entorno Android nativo, por lo que debe usar la API de Capacitor y manejar correctamente la navegación entre vistas y la doble pulsación para salir de la app."

**Objetivo:** Refinar la interfaz y la interacción para que la aplicación se sienta fluida y nativa en un dispositivo móvil, corrigiendo problemas de usabilidad antes del empaquetado final.

  * **[x] Control de Zoom y Desbordamiento de Contenido:**
      * **Bloquear Zoom:** En `frontend/index.html`, modificar la etiqueta `<meta name="viewport">` para incluir `user-scalable=no` y prevenir el "pinch-to-zoom".
      * **Scroll Horizontal en Código:** Aplicar CSS a los contenedores de bloques de código (`<pre>`) para que tengan `overflow-x: auto`. Esto permitirá el scroll horizontal solo en esos elementos cuando el contenido (como un script) sea demasiado ancho, solucionando el desbordamiento.
  * **[x] Implementar Botón para Detener Generación:**
      * **Lógica de Cancelación:** Integrar un `AbortController` en la llamada `fetch` del `backendService.ts`.
      * **Interfaz de Usuario:** Mostrar un botón "Detener" en la UI (por ejemplo, reemplazando el botón de "Enviar") mientras el bot está generando una respuesta.
      * **Funcionalidad:** Al hacer clic en "Detener", se debe llamar a `controller.abort()`, lo que cancelará la petición de streaming y detendrá la generación de texto.
  * **[x] Implementar Gestos Nativos:**
      * **[x] Integrar Librería de Gestos:** Añadir una librería como `react-use-gesture` al proyecto de frontend para un manejo de gestos táctiles robusto.
      * **[x] Desplegar Sidebar:** En la `HomePage`, usar la librería de gestos para detectar un deslizamiento hacia la derecha (swipe-right) en el área principal y llamar a la función que abre el Sidebar.
  * **[x] Integrar Funcionalidad del Botón "Atrás" de Android (Implementación Conceptual):**
      * **[x] Escuchar Evento Nativo:** Implementación conceptual para navegador completada. Para Android nativo se usará la API de Capacitor (`App.addListener('backButton', ...)`) para capturar el evento del botón "Atrás" del sistema operativo.
      * **[x] Lógica de Navegación Contextual:**
          * **[x] Si el usuario está en una vista de chat (`ChatPage`), al presionar "Atrás" la aplicación debe navegar a la `HomePage`.
          * **[x] Si el usuario ya está en la `HomePage`, el primer toque de "Atrás" debe mostrar un mensaje temporal (Toast) como "Presiona de nuevo para salir".
          * **[x] Un segundo toque dentro de un corto período de tiempo (ej. 2 segundos) cerrará la aplicación (`App.exitApp()`).


# Fase 4: Empaquetado para Android (Creación del APK)

**Objetivo:** Envolver la aplicación web de React, ya pulida, en un contenedor nativo para crear un archivo `.apk` instalable en dispositivos Android usando Capacitor.

### 4.1. Prerrequisitos

  * **[x] Instalar Android Studio:** Descargar e instalar desde el sitio oficial de Android.
  * **[x] Instalar un JDK (Java Development Kit):** Asegurarse de tener un JDK compatible instalado y configurado en el sistema.

### 4.2. Preparar el Proyecto de React para Capacitor

  * **[x] Instalar Dependencias de Capacitor:** En la terminal, dentro de la carpeta `/frontend`, ejecutar:
    ```bash
    npm install @capacitor/core @capacitor/cli @capacitor/android
    ```
  * **[x] Inicializar Capacitor:** Este comando crea el archivo de configuración de Capacitor.
    ```bash
    npx cap init "Project J.A.R.V.I.S v1" "uk.wuzi.assist" --web-dir "dist"
    ```
  * **[x] Construir la Aplicación de React:** Crear la versión de producción de la app.
    ```bash
    npm run build
    ```
  * **[x] Añadir la Plataforma Android:** Este comando crea un proyecto nativo de Android.
    ```bash
    npx cap add android
    ```

### 4.3. Configuración y Sincronización

  * **[x] Sincronizar los Archivos Web:** Copiar los últimos cambios de la carpeta `/dist` al proyecto nativo de Android. Ejecutar este comando cada vez que se realicen cambios en el código de React.
    ```bash
    npx cap sync android
    ```
  * **[ ] Abrir el Proyecto en Android Studio:**
    ```bash
    npx cap open android
    ```
  * **[ ] Configurar Permisos de Red:**
      * En Android Studio, buscar y abrir el archivo `android/app/src/main/AndroidManifest.xml`.
      * Asegurarse de que el permiso de internet esté presente: `<uses-permission android:name="android.permission.INTERNET" />`.

### 4.4. Generar el APK

  * **[x] Configurar SDK de Android:** Configurar la ruta del SDK en `local.properties`.
  * **[x] Generar el APK de Debug:** Usar Gradle para construir el APK de desarrollo.
    ```bash
    .\gradlew assembleDebug
    ```
  * **[x] APK Generado:** El archivo `app-debug.apk` se encuentra en `frontend/android/app/build/outputs/apk/debug/`.
  * **[ ] Generar el APK Firmado (Opcional para Producción):**
      * En Android Studio, ir a `Build > Generate Signed Bundle / APK....`
      * Seleccionar `APK` y hacer clic en `Next`.
      * Hacer clic en `Create new...` y rellenar el formulario para crear un archivo de clave (`.jks`). **Guardar este archivo y sus contraseñas en un lugar seguro.**
      * Con los datos del keystore cargados, seleccionar el tipo de build `release`.
      * Hacer clic en `Create`.
      * Localizar el archivo `.apk` generado en la carpeta `frontend/android/app/release/`.

-----

## Fase 5: Corrección de Problemas Post-Testeo Móvil

**Objetivo:** Resolver los problemas identificados durante el primer testeo en dispositivo Android real (Android 15 - Xiaomi 12 Pro) para lograr una experiencia móvil nativa completa.

### 5.1. Corrección de Gestos Táctiles

  * **[ ] Instalar Plugins de Capacitor para Gestos:**
    ```bash
    npm install @capacitor/haptics
    ```
  * **[ ] Revisar Configuración de react-use-gesture:**
      * Verificar que la librería esté correctamente instalada y configurada.
      * Asegurar que los event listeners estén capturando eventos táctiles nativos en WebView.
      * Revisar la configuración CSS `touch-action` en los elementos interactivos.
  * **[ ] Implementar Feedback Háptico:**
      * Integrar `@capacitor/haptics` para proporcionar retroalimentación táctil cuando se detecten gestos.
      * Añadir vibración sutil al abrir/cerrar el sidebar con gestos.

### 5.2. Implementación Real del Botón Back de Android ✅ COMPLETADO

  * **[x] Instalar Plugin de App de Capacitor:**
    ```bash
    npm install @capacitor/app
    ```
  * **[x] Implementar Listener del Botón Back:**
      * En el componente principal de la aplicación (`App.tsx`), implementado:
        ```typescript
        import { App } from '@capacitor/app';
        
        App.addListener('backButton', ({ canGoBack }) => {
          // Lógica de navegación contextual implementada
        });
        ```
  * **[x] Configurar Lógica de Navegación Contextual:**
      * Si está en `ChatPage`, navegar a `HomePage`.
      * Si está en `HomePage`, mostrar toast "Presiona de nuevo para salir".
      * Segundo toque en 2 segundos: `App.exitApp()`.
  * **[x] Compatibilidad con Android 15:**
      * Configuraciones verificadas en `capacitor.config.ts`.
      * Permisos correctos en `AndroidManifest.xml`.
  * **[x] VALIDACIÓN FINAL:** ✅ **Funciona correctamente para todos los casos de uso.**

### 5.3. Corrección de Conectividad con Backend ❌ PENDIENTE

  * **[ ] Configurar IP Local en lugar de Localhost:**
      * Identificar la IP local de la máquina donde corre el backend.
      * Actualizar la configuración del frontend para usar la IP local (ej: `http://192.168.1.100:8000`).
      * Crear variable de entorno para facilitar el cambio entre desarrollo local y producción.
  * **[ ] Verificar Configuración CORS del Backend:**
      * Asegurar que el backend permita peticiones desde la IP del dispositivo móvil.
      * Configurar headers CORS apropiados para peticiones multimodales.
  * **[ ] Implementar Manejo de Errores Mejorado:**
      * Añadir logs detallados en el frontend para diagnosticar errores de conectividad.
      * Implementar retry automático para peticiones fallidas.
      * Mostrar mensajes de error específicos al usuario.
  * **❌ PROBLEMA ACTUAL:** La comunicación con el backend sigue fallando. Los logs muestran peticiones exitosas (status 200) pero la app muestra "Sorry, I encountered an error."

### 5.4. Solución del Problema del Teclado Virtual ⚠️ CASI CORRECTO

  * **[x] Instalar Plugin de Teclado de Capacitor:**
    ```bash
    npm install @capacitor/keyboard
    ```
  * **[x] Configurar Viewport Dinámico:**
      * Implementados listeners para eventos `keyboardWillShow` y `keyboardWillHide` en `ChatPage.tsx`.
      * Ajuste dinámico de la altura del contenedor de chat cuando aparece el teclado.
  * **[x] Implementar Scroll Automático:**
      * Scroll automático implementado para mantener visible el input de mensaje.
      * El último mensaje del chat permanece visible cuando aparece el teclado.
  * **[x] Configurar Capacitor para Resize:**
      * En `capacitor.config.ts`, configurar:
        ```typescript
        plugins: {
          Keyboard: {
            resize: KeyboardResize.Body, // 'body' es correcto para React puro (no Ionic)
            resizeOnFullScreen: true
          }
        }
        ```
      * **Nota:** Para aplicaciones React puras (no Ionic), `KeyboardResize.Body` es la opción correcta ya que permite que el WebView se redimensione automáticamente cuando aparece el teclado virtual.
  * **⚠️ PROBLEMA PENDIENTE:** Queda un espacio gris extra cuando aparece el teclado. Sospecha: relacionado con el problema de la barra de estado.

### 5.5. Corrección de la Barra de Estado (Status Bar) ❌ REQUIERE REVISIÓN

  * **[x] Instalar Plugin de Status Bar:**
    ```bash
    npm install @capacitor/status-bar
    ```
  * **[x] Configurar Safe Area en CSS:**
      * Actualizado `index.html` con `viewport-fit=cover`.
      * CSS variables para safe area implementadas en la aplicación.
  * **[x] Configurar Status Bar Overlay:**
      * Configuración de status bar implementada en `App.tsx`:
        ```typescript
        import { StatusBar, Style } from '@capacitor/status-bar';
        
        StatusBar.setStyle({ style: Style.Dark });
        StatusBar.setOverlaysWebView({ overlay: false });
        StatusBar.setBackgroundColor({ color: '#111827' });
        ```
  * **[x] Ajustar Tema de la Aplicación:**
      * Color de la status bar configurado para coincidir con el tema oscuro de la aplicación (#111827).
      * Configuración apropiada para el modo oscuro implementada.
  * **❌ PROBLEMAS IDENTIFICADOS:**
      * **Scroll no deseado:** La "dimensión extra" permite scroll vertical que corta el botón de nuevo chat.
      * **Superposición:** La barra de estado vuelve a superponerse en algunos casos.
      * **Impacto en teclado:** Este problema parece estar relacionado con el espacio gris extra del teclado.
  * **[ ] TAREAS PENDIENTES:**
      * Revisar y ajustar la lógica de safe areas.
      * Corregir el cálculo de altura del viewport.
      * Eliminar el scroll vertical no deseado.
      * Asegurar que la status bar no se superponga al contenido.

### 5.6. Testing y Validación Final

  * **[x] Rebuild y Re-sync:**
      * Ejecutar `npm run build` para incorporar todos los cambios.
      * Ejecutar `npx cap sync android` para sincronizar con el proyecto nativo.
  * **[x] Generar Nuevo APK de Testing:**
      * Construir nuevo APK con las correcciones implementadas.
      * Instalar y probar en el dispositivo Android 15.
  * **[x] Validar Cada Problema Corregido:**
      * ✅ **Gestos de deslizamiento:** Funcionan correctamente.
      * ✅ **Botón back de Android:** Responde apropiadamente en todos los casos.
      * ❌ **Conectividad con backend:** Sigue fallando (logs muestran 200 pero app muestra error).
      * ⚠️ **Teclado virtual:** Casi correcto, pero queda espacio gris extra.
      * ❌ **Barra de estado:** Problemas de scroll y superposición persisten.

### 5.7. Problemas Críticos Pendientes (Próxima Iteración)

  * **[ ] PRIORIDAD ALTA - Corregir Status Bar y Safe Areas:**
      * Revisar implementación actual de safe areas en CSS.
      * Ajustar configuración de `StatusBar.setOverlaysWebView()`.
      * Eliminar scroll vertical no deseado que corta el botón de nuevo chat.
      * Corregir cálculo de altura del viewport para evitar superposición.
  * **[ ] PRIORIDAD ALTA - Solucionar Conectividad Backend:**
      * Investigar por qué las peticiones exitosas (200) no se procesan correctamente en el frontend.
      * Revisar manejo de respuesta streaming en `backendService.ts`.
      * Verificar configuración CORS y headers de respuesta.
  * **[ ] PRIORIDAD MEDIA - Ajustar Teclado Virtual:**
      * Eliminar espacio gris extra relacionado con problemas de status bar.
      * Verificar configuración de `KeyboardResize.Body` en contexto de safe areas corregidas.

-----