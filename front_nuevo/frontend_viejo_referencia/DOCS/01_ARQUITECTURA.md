# /DOCS/01_ARQUITECTURA.md: Arquitectura de uWuzi-Assist

## Patrón Arquitectónico

**Patrón Principal:** Arquitectura Cliente-Servidor con un backend local contenerizado.

*   **Cliente:** Aplicación móvil (Frontend React/Vite empaquetado como .apk) operando en un dispositivo Android.
*   **Servidor:** Pila de backend ejecutándose en el PC local del usuario, orquestada con Docker. Esta pila incluye FastAPI, n8n, Ollama y Supabase.

**Justificación:**
Esta arquitectura fue elegida para "uWuzi-Assist" con un fuerte énfasis en la **privacidad**, el **control local** y el **uso personal**. Permite que herramientas de IA potentes (como Ollama para LLMs locales y n8n para flujos de trabajo agénticos) se ejecuten directamente en el hardware del usuario, sin depender de servicios en la nube de terceros para las funciones principales. La interfaz móvil (.apk) proporciona una forma conveniente de acceder a estas capacidades locales, ya sea dentro de la red local (WiFi) o de forma remota a través de una VPN segura o un túnel Cloudflare configurado por el usuario. Este enfoque maximiza la soberanía de los datos y la personalización.

## Descripción de Componentes Principales

### Frontend (Mobile .apk)
*   **Responsabilidades:**
    *   Proveer la interfaz de usuario (UI) e interacción (UX) en el dispositivo móvil.
    *   Capturar la entrada del usuario (texto, potencialmente voz o imágenes en el futuro).
    *   Mostrar las respuestas y resultados del backend.
    *   Gestionar el estado del lado del cliente (ej: estado de la conexión, historial de chat local, configuración de la app).
*   **Framework/Tecnología Principal:** React con Vite, TypeScript, Tailwind CSS, shadcn/ui.
*   **Comunicación con el Backend:** Realiza llamadas API (principalmente RESTful JSON) al backend FastAPI a través de la red local (WiFi) o una conexión segura configurada por el usuario (VPN, túnel Cloudflare).

### Backend (Pila en PC Local - Orquestado con Docker)

*   **Docker:**
    *   **Responsabilidades:** Plataforma de contenerización que gestiona y aísla todos los servicios del backend (FastAPI, n8n, Ollama, Supabase, Caddy). Asegura la portabilidad y la facilidad de configuración del entorno de backend.

*   **Caddy Server:**
    *   **Responsabilidades:** (Opcional, pero recomendado para una configuración robusta) Actúa como reverse proxy para el servicio FastAPI. Puede gestionar automáticamente SSL/TLS para acceso seguro a través de la red local (ej: `https://local-ip-address`) o si se expone a través de un nombre de dominio. Simplifica el enrutamiento y la seguridad.

*   **FastAPI:**
    *   **Responsabilidades:** Es el corazón de la API del backend.
        *   Recibe todas las solicitudes HTTP de la aplicación móvil.
        *   Valida los datos de entrada.
        *   Orquesta la lógica de negocio, decidiendo si una solicitud se dirige a Ollama para chat directo o a n8n para tareas agénticas complejas.
        *   Formatea y envía las respuestas de vuelta al cliente móvil.
        *   Maneja la autenticación de usuarios (si se implementa más allá del admin de Supabase).
    *   **Lenguaje/Framework Principal:** Python con FastAPI.

*   **n8n:**
    *   **Responsabilidades:** Plataforma de automatización de flujos de trabajo que maneja las tareas agénticas.
        *   Ejecuta flujos de trabajo complejos activados por webhooks desde FastAPI.
        *   Interactúa con Ollama para procesamiento de lenguaje natural, toma de decisiones o generación de contenido dentro de un flujo.
        *   Se conecta a otras herramientas o APIs (ej: APIs de calendario, correo electrónico, bases de datos, servicios web) a través de sus nodos integrados o nodos personalizados.
        *   Puede almacenar y recuperar información de Supabase para mantener el estado o el historial de las tareas.
    *   **Tecnología Principal:** Node.js.

*   **Ollama:**
    *   **Responsabilidades:** Provee acceso a modelos de lenguaje grandes (LLMs) que se ejecutan localmente.
        *   Ofrece capacidades de chat conversacional directo.
        *   Sirve como "cerebro" para tareas que requieren comprensión o generación de lenguaje natural dentro de los flujos de n8n.
        *   Permite la experimentación con diferentes LLMs locales.
    *   **Tecnología Principal:** Go.

*   **Supabase (PostgreSQL):**
    *   **Responsabilidades:** Base de datos relacional y plataforma de backend como servicio (aunque aquí se usa principalmente su componente PostgreSQL contenerizado).
        *   Almacena el historial de conversaciones del chatbot.
        *   Guarda datos de usuario (inicialmente un único usuario administrador para la gestión de la aplicación y potencialmente perfiles de uso si se expande).
        *   Mantiene la configuración de la aplicación y preferencias del usuario.
        *   Potencialmente almacena datos para widgets del dashboard (ej: seguimiento de hábitos, registro de gastos, si estas funcionalidades se añaden).
        *   Puede ser utilizado por n8n para persistir el estado de los flujos de trabajo o datos relevantes para las tareas.
    *   **Tecnología Principal:** PostgreSQL, Go (para las APIs de Supabase, aunque se interactúa principalmente vía SQL o sus SDKs).

## Flujo de Datos Principal (Ejemplo: Comando Agéntico)

A continuación, se describe cómo fluye la información para una operación agéntica típica:

**Operación de Ejemplo:** "Agendar 'Reunión de Equipo' para mañana a las 10 AM en el calendario."

1.  **Usuario (Mobile App):** El usuario escribe el comando "Agendar 'Reunión de Equipo' para mañana a las 10 AM" en la interfaz de chat de la aplicación móvil y lo envía, posiblemente seleccionando un modo "agente" o "tarea".
2.  **Mobile App (.apk):** La aplicación formatea el comando en una solicitud JSON estructurada (ej: `{ "type": "agent_command", "command_text": "Agendar 'Reunión de Equipo' para mañana a las 10 AM" }`) y la envía al endpoint correspondiente de la API FastAPI en el backend local (ej: `POST /api/v1/agent/execute`).
3.  **Caddy Server (si está configurado):** Recibe la solicitud HTTPS/HTTP, la procesa (ej: terminación SSL) y la reenvía al servicio FastAPI.
4.  **FastAPI:**
    *   Recibe la solicitud.
    *   Valida el payload (ej: que el texto del comando no esté vacío).
    *   Determina que es un comando para el agente y lo reenvía a un webhook específico de n8n configurado para manejar comandos de calendario.
5.  **n8n (Workflow):**
    *   El webhook de n8n recibe los datos del comando.
    *   El flujo de trabajo se activa:
        *   **Paso 1 (Parseo/Entendimiento):** El texto del comando se envía a Ollama (LLM local) para extraer entidades (nombre del evento: "Reunión de Equipo", fecha: "mañana", hora: "10 AM").
        *   **Paso 2 (Lógica de Calendario):** Con las entidades extraídas, el flujo utiliza un nodo de calendario (o un nodo HTTP para llamar a una API de calendario como Google Calendar si se ha configurado una integración segura) para crear el evento.
        *   **Paso 3 (Manejo de Respuesta):** El flujo recibe la confirmación (o error) de la herramienta de calendario.
    *   n8n formula una respuesta (ej: `{ "status": "success", "message": "Evento 'Reunión de Equipo' creado para mañana a las 10 AM." }` o `{ "status": "error", "message": "No se pudo crear el evento: [detalle del error]" }`).
6.  **FastAPI:** Recibe la respuesta HTTP del webhook de n8n.
7.  **FastAPI:** Retransmite esta respuesta JSON al cliente móvil.
8.  **Mobile App (.apk):**
    *   Recibe la respuesta de FastAPI.
    *   Actualiza la interfaz de usuario para mostrar el mensaje de resultado al usuario (ej: "Evento 'Reunión de Equipo' creado para mañana a las 10 AM.").
    *   (Opcional) Puede almacenar la interacción en el historial de chat local y/o sincronizar con Supabase.

Este flujo ilustra la colaboración entre los componentes para realizar una tarea compleja iniciada por el usuario desde la aplicación móvil, manteniendo toda la lógica y los datos sensibles (si no se usan APIs externas) dentro del entorno local del usuario.
