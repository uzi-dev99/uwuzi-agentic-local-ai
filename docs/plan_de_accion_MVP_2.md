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

## Fase 4: Bases para el Modo Agente (Integración con n8n)

**Objetivo:** Preparar la infraestructura para la V2, permitiendo que el backend se comunique con un workflow de n8n a través de webhooks. Esto es el primer paso para habilitar el "Modo Agente".

### Plan de Acción Técnico

**[ ] Tarea 4.1: Configuración del Webhook en n8n**

*   **Objetivo:** Crear un workflow simple en n8n que se active mediante un webhook.
*   **Pasos a Seguir:**
    1.  En la instancia de n8n, crear un nuevo workflow.
    2.  Añadir un nodo "Webhook" como disparador (trigger).
    3.  Configurar el webhook para que espere peticiones `POST`.
    4.  Copiar la URL del webhook de prueba (Test URL).

**[ ] Tarea 4.2: Implementar Servicio de n8n en el Backend**

*   **Objetivo:** Crear un nuevo servicio en el backend (`n8n_service.py`) que se encargue de llamar al webhook de n8n.
*   **Estrategia de Implementación:**
    1.  **Crear `backend/services/n8n_service.py`:**
        *   Añadir una función `invoke_workflow(data: dict)`.
        *   Esta función usará `httpx` para hacer una petición `POST` a la URL del webhook obtenida en el paso anterior.
        *   La URL se almacenará en una nueva variable de entorno `N8N_WEBHOOK_URL` en el archivo `.env`.
    2.  **Actualizar `backend/main.py`:**
        *   Importar el nuevo servicio.
        *   En el endpoint `POST /api/v1/agent/invoke` (que actualmente es un placeholder), añadir la lógica para llamar a `n8n_service.invoke_workflow` con los datos de la petición.

**[ ] Tarea 4.3: Workflow Simple de Prueba**

*   **Objetivo:** Completar el circuito en n8n para asegurar que la comunicación funciona.
*   **Pasos a Seguir:**
    1.  En el workflow de n8n, después del nodo "Webhook", añadir un nodo "Set".
    2.  Configurar el nodo "Set" para que tome un valor de la entrada del webhook (ej: `{{ $json.body.message }}`) y lo añada a un nuevo campo (ej: `response_message`).
    3.  Añadir un nodo final que responda a la petición del webhook, devolviendo el `response_message`.

**[ ] Tarea 4.4: Prueba de Extremo a Extremo**

*   **Objetivo:** Verificar que el backend puede activar el workflow de n8n y recibir una respuesta.
*   **Pasos a Seguir:**
    1.  Utilizar una herramienta como Postman o `curl` para enviar una petición `POST` al endpoint `/api/v1/agent/invoke` del backend.
    2.  Verificar que la petición activa el workflow en n8n y que la respuesta de n8n se devuelve correctamente a través del backend.

