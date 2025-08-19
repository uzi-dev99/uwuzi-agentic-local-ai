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

## Fase 2: Mejoras UI [COMPLETADA]

*   **[x] Implementar Timestamps y Agrupación de Mensajes por Fecha.**
*   **[x] Ajustar la Paleta de Colores del Modo Oscuro.**
*   **[x] Añadir Transiciones de Navegación entre Páginas.**

---

## Fase 3: Conectividad Nativa (Android)

**Objetivo:** Garantizar que la aplicación Android empaquetada (.apk) pueda comunicarse exitosamente con el backend local para enviar y recibir mensajes, solucionando el error "Sorry, I encountered an error" que ocurre exclusivamente en la versión nativa.

**Diagnóstico Actualizado:** El error `context canceled` que aparece en los logs del proxy inverso (Caddy/Traefik) cuando el cliente es Android, no se debe a un problema de resolución de `localhost`, sino a cómo el proxy maneja las conexiones de streaming (`keep-alive`) con el backend de uvicorn. La conexión se corta prematuramente. La solución más robusta y sencilla es **desactivar el streaming en el backend** y devolver la respuesta completa de una sola vez.

### Plan de Acción Técnico

**Tarea 3.1: Análisis de Configuración de Red**

*   **Objetivo:** Identificar dónde se define la URL del backend en el código del frontend y confirmar que está utilizando `localhost`.
*   **Archivos a Inspeccionar:**
    1.  `frontend/services/backendService.ts`: Localizar la variable o constante que define la URL base de la API.
    2.  `frontend/capacitor.config.ts`: Revisar si existe alguna configuración de servidor que pueda estar afectando la comunicación.

**[x] Tarea 3.2: Desactivar Streaming en el Backend**

*   **Objetivo:** Modificar el backend para que genere y devuelva la respuesta completa del modelo en una única petición HTTP, en lugar de un stream.
*   **Estrategia de Implementación:**
    1.  **`backend/services/chat_service.py`:**
        *   Modificar la función `generate_response` para que sea `async` y devuelva un `Dict` en lugar de un `AsyncGenerator`.
        *   Cambiar el payload de la petición a Ollama a `"stream": False`.
        *   En lugar de iterar sobre la respuesta, hacer una única llamada `await client.post(...)` y procesar la respuesta JSON completa.
        *   Devolver el diccionario JSON resultante.
    2.  **`backend/main.py`:**
        *   Cambiar la importación de `StreamingResponse` a `JSONResponse`.
        *   En el endpoint `direct_chat_endpoint`, `await` la llamada a `generate_response`.
        *   Envolver la respuesta en un `JSONResponse(content=response_data)`.

**[x] Tarea 3.3: Adaptar el Frontend a la Respuesta No-Stream**

*   **Objetivo:** Modificar el servicio del frontend que consume la API para que maneje una respuesta JSON estándar en lugar de un stream.
*   **Archivos a Inspeccionar y Modificar:**
    1.  `frontend/services/backendService.ts`: Localizar la función que llama al endpoint `/api/v1/chat/direct`.
    2.  **Lógica a Cambiar:**
        *   Reemplazar la lógica de `fetch` que procesa el stream (usando `ReadableStreamDefaultReader` y `TextDecoder`) por una llamada `axios` estándar o una llamada `fetch` que simplemente espera el `.json()` de la respuesta.
        *   La función deberá devolver la respuesta completa al `ChatContext` para que actualice el estado.

**[x] Tarea 3.4: Verificación en Dispositivo Físico**

*   **Objetivo:** Compilar, ejecutar y probar la aplicación en un dispositivo Android para confirmar que la nueva estrategia de respuesta no-stream soluciona el problema de conectividad.
*   **Pasos a Seguir:**
    1.  Reiniciar el servidor de backend para aplicar los cambios.
    2.  Sincronizar los cambios del proyecto web con la plataforma nativa: `npx capacitor sync android`.
    3.  Abrir el proyecto en Android Studio: `npx capacitor open android`.
    4.  Compilar y ejecutar la aplicación en el emulador o dispositivo físico.
    5.  Realizar una prueba de extremo a extremo: enviar un mensaje y verificar que se recibe la respuesta completa del modelo sin errores.

-----

## Fase 4: Modo Agente como Canal Directo (Proxy n8n)

**Objetivo:** Habilitar el modo agente como un proxy transparente hacia n8n, soportando `application/json` y `multipart/form-data` para transportar texto, imágenes base64/archivos, audio .mp3, PDF y archivos arbitrarios. La lógica de negocio vive en n8n; el backend solo reenvía y normaliza la respuesta para que siempre incluya `content`.

### Plan de Acción Técnico

- **[x] Tarea 4.1: Actualizar Endpoint del Agente en Backend (proxy transparente)**
  - Permitir `application/json` y `multipart/form-data` en `POST /api/v1/agent/invoke`.
  - Detectar el `Content-Type` y reenviar a n8n mediante:
    - JSON: `invoke_workflow(payload)`
    - Multipart: `invoke_workflow_multipart(form_fields, files)`
  - Normalizar respuesta a `{ content: string, ... }`.

- **[x] Tarea 4.2: Servicio de n8n en Backend**
  - Implementar `invoke_workflow(data: dict)` para JSON.
  - Implementar `invoke_workflow_multipart(form_fields: Dict[str, string], files: List[UploadFile])` para multipart.
  - Gestionar errores y normalizar respuesta con `content`.

- **[x] Tarea 4.3: Frontend - soporte multipart en invokeAgent**
  - Actualizar `frontend/services/backendService.ts` para que `invokeAgent` acepte `files` y construya `FormData` cuando corresponda.
  - Respetar la interfaz unificada de respuesta `{ content }`.

- **[x] Tarea 4.4: Integración en ChatPage**
  - Pasar adjuntos al modo agente: convertir `FileData` a `File` y enviar vía `invokeAgent` usando la nueva firma basada en objeto.

- **[ ] Tarea 4.5: Configuración del Webhook en n8n**
  - Crear workflow con nodo Webhook (POST) y capturar campos:
    - `messages` (JSON string) y `files` (array) en multipart.
    - Payload JSON cuando sea `application/json`.
  - Ajustar nodos para responder con `{ content: string }`.

- **[ ] Tarea 4.6: Workflow de Prueba en n8n (E2E simple)**
  - Después del Webhook: nodo Function/Set que lea `messages` y, si hay archivos, devuelva metadatos (nombre, tipo, tamaño) o procese según caso (p. ej., enviar audio a transcripción).
  - Responder con `{ content: 'OK: recibido X archivo(s), último mensaje: ...' }`.

- **[ ] Tarea 4.7: Validación E2E y en Dispositivo Físico**
  - Probar desde la app: enviar texto, imagen, audio .mp3, PDF y archivo arbitrario en modo agente.
  - Confirmar que n8n recibe correctamente `messages` y `files` y responde con `{ content }`.
  - Validar UX móvil: feedback de envío, estados de carga, errores claros.

### Notas de Contrato (Backend <-> n8n)

- En multipart, el backend envía:
  - Campo `messages`: string JSON del arreglo de `{ role, content }`.
  - Múltiples `files` bajo la misma clave `files`.
- En JSON, el backend envía `{ messages: BackendMessage[] }`.
- n8n debe responder siempre `{ content: string, ... }` (el backend lo normaliza si no coincide).

### Próxima Tarea a Ejecutar

- Ejecutar Tarea 4.5 y 4.6 en n8n: crear el webhook y un workflow de eco que devuelva `{ content }`, validando que recibe `messages` y `files` desde la app. Luego realizar la Tarea 4.7 de validación en dispositivo.

### Criterios de Aceptación

- Modo agente envía y recibe correctamente los tipos: texto, imagen base64/archivo, audio .mp3, PDF y archivo arbitrario.
- La respuesta del backend hacia el frontend siempre contiene `content`.
- La UI muestra el contenido devuelto sin errores y mantiene una UX móvil fluida.

