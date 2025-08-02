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

## Fase 2: Mejoras UI  

- **Falta hora en los mensajes enviados y recibidos, también de ser posible like whatsapp separar por día.**

- **Cambiar colores azulados del modo oscuro, por colores más grises oscuros.**

- **Añadir transición de derecha a izquierda like whatsapp al momento de abrir un chat o volver al homepage, ese efecto de transición como si el chat se deslizase de izq a derecha.**

### Plan de Acción Técnico

Aquí detallo las tareas necesarias para completar la Fase 2.

**Tarea 1: Implementar Timestamps y Agrupación de Mensajes por Fecha**

*   **Objetivo:** Mostrar la hora en cada burbuja de mensaje y agrupar los mensajes por día con un separador de fecha para mejorar la contextualización temporal de la conversación.
*   **Archivos a Modificar:**
    1.  `frontend/components/MessageList.tsx`: Se implementará la lógica principal aquí. Se creará una función para procesar la lista de mensajes y agruparlos por fecha. Antes de renderizar los mensajes de un nuevo día, se insertará un componente `DateSeparator`.
    2.  `frontend/components/MessageContent.tsx`: Se modificará para añadir un pequeño elemento de texto con la hora del mensaje (`createdAt`) dentro de la burbuja de chat, formateado a `HH:mm`.
    3.  `frontend/components/DateSeparator.tsx` (Nuevo): Se creará un nuevo componente simple para mostrar la fecha (ej: "Hoy", "Ayer", "15 de Julio").

**Tarea 2: Ajustar la Paleta de Colores del Modo Oscuro (En Curso)**

*   **Objetivo:** Refinar la estética de la aplicación, migrando de una paleta con tonos azules a una con grises oscuros, egocéntricos y más elegante.
*   **Enfoque:** Se realizará una búsqueda directa de los códigos de color azules en la base de código del frontend y se reemplazarán por una nueva paleta de grises oscuros. Este enfoque evita una refactorización completa del sistema de estilos para una entrega más rápida.
*   **Archivos Potenciales a Modificar:**
    1.  `frontend/index.css`: Principal candidato para albergar las variables de color base.
    2.  Componentes `.tsx`: Búsqueda de colores hardcodeados o clases de utilidad específicas.

**Tarea 3: Añadir Transiciones de Navegación entre Páginas**

*   **Objetivo:** Aumentar la sensación de fluidez y de aplicación nativa implementando animaciones de deslizamiento al navegar entre la lista de chats y una conversación específica.
*   **Archivos a Modificar:**
    1.  `frontend/App.tsx`: Se envolverá la definición de las rutas (`<Routes>`) con un gestor de animaciones. `Framer Motion` es la herramienta ideal para esto, usando su componente `<AnimatePresence>`.
    2.  `frontend/pages/HomePage.tsx` y `frontend/pages/ChatPage.tsx`: Se añadirán propiedades de animación a los contenedores principales de estas páginas para definir las transiciones de entrada y salida (deslizamiento desde/hacia la derecha).

