# /DOCS/03_COMPONENTES.md: Componentes de uWuzi-Assist

Este documento detalla los componentes reutilizables de la interfaz de usuario (UI) y los módulos de lógica de negocio principales del proyecto "uWuzi-Assist".

## Filosofía de Componentes

En "uWuzi-Assist", la filosofía de componentes se centra en un enfoque pragmático y eficiente:

*   **Base de UI con `shadcn/ui`:** Utilizamos `shadcn/ui` para la mayoría de los componentes de UI fundamentales (botones, inputs, cards, etc.). Estos componentes son altamente composables y personalizables a través de clases de utilidad de Tailwind CSS, lo que nos permite construir interfaces consistentes rápidamente. No son componentes en el sentido tradicional de una librería que se importa, sino más bien "recetas" de código que se copian y personalizan.
*   **Componentes Funcionales Específicos:** Para características únicas de uWuzi-Assist, como la interfaz de chat, los widgets del dashboard o elementos de UI muy específicos, desarrollamos componentes React personalizados. Estos se construyen utilizando TypeScript, React (Hooks, Context API) y Tailwind CSS.
*   **Estado Global y Lógica de UI:** Se utiliza `@tanstack/react-query` para la gestión del estado del servidor (llamadas API) y `React Context` o `zustand` (si se introduce) para estados globales de UI más simples.

## Biblioteca de Componentes (UI - Frontend)

A continuación, se describen algunos componentes UI clave de uWuzi-Assist.

---

### Componente: `Button` (de `src/components/ui/Button.tsx`)

*   **Propósito:** Es el componente base para todas las acciones clickeables en la aplicación. Hereda la flexibilidad y personalización de `shadcn/ui` y Tailwind CSS.
*   **Props (Propiedades Clave):**
    | Nombre    | Tipo                                    | Descripción                                     |
    |-----------|-----------------------------------------|-------------------------------------------------|
    | `variant` | `'default'`, `'destructive'`, `'outline'`, `'secondary'`, `'ghost'`, `'link'` | Estilo visual del botón.                        |
    | `size`    | `'default'`, `'sm'`, `'lg'`, `'icon'`   | Tamaño del botón.                               |
    | `asChild` | `boolean`                               | Permite renderizar el botón como un slot de otro componente. |
    | `onClick` | `React.MouseEventHandler<HTMLButtonElement>` | Función a ejecutar al hacer clic.               |
*   **Ejemplo de Uso (Conceptual):**
    *   Utilizado en toda la aplicación para enviar formularios (ej: `ChatInput`), disparar acciones (ej: botones en modales, elementos del dashboard), y navegación (si `variant='link'`).

---

### Componente: `ChatInput` (de `src/components/ChatInput.tsx`)

*   **Propósito:** Componente personalizado para la entrada de texto en la interfaz de chat. Maneja el estado del mensaje, el envío y la interacción con el backend para los modos 'chat' y 'agente'.
*   **Props (Propiedades Clave):**
    | Nombre              | Tipo                               | Descripción                                                        |
    |---------------------|------------------------------------|--------------------------------------------------------------------|
    | `sendMessage`       | `(message: string, mode: 'chat' \| 'agent') => void` | Función callback para enviar el mensaje al backend.                |
    | `currentMode`       | `'chat' \| 'agent'`                | Modo actual de operación del chat (determina el endpoint/lógica).  |
    | `isWaitingResponse` | `boolean`                          | Indica si la app está esperando una respuesta del backend.         |
*   **Ejemplo de Uso (Conceptual):**
    *   Posicionado en la parte inferior de la pantalla de Chat. Permite al usuario escribir mensajes, seleccionar el modo (chat/agente) y enviar.

---

### Componente: `MessageBubble` (de `src/components/MessageBubble.tsx`)

*   **Propósito:** Componente personalizado para mostrar un mensaje individual dentro de la lista de chat. Diferencia visualmente entre mensajes del usuario y del asistente (IA/Agente).
*   **Props (Propiedades Clave):**
    | Nombre    | Tipo                               | Descripción                                                        |
    |-----------|------------------------------------|--------------------------------------------------------------------|
    | `message` | `object` (ej: `{ id: string, text: string, sender: 'user' \| 'assistant', timestamp: Date }`) | Objeto que contiene los detalles del mensaje.                       |
    | `isOwn`   | `boolean`                          | `true` si el mensaje es del usuario actual, `false` si es del asistente. |
*   **Ejemplo de Uso (Conceptual):**
    *   Utilizado dentro de una lista virtualizada (ej: `@tanstack/react-virtual`) en la pantalla de Chat para renderizar cada mensaje del historial de conversación.

---

### Componente: `HabitTracker` (de `src/components/dashboard/HabitTracker.tsx`)

*   **Propósito:** Widget personalizado para el dashboard que permite al usuario definir y rastrear hábitos diarios o semanales.
*   **Props (Propiedades Clave):**
    | Nombre   | Tipo                               | Descripción                                                                 |
    |----------|------------------------------------|-----------------------------------------------------------------------------|
    | `habits` | `Array<object>` (ej: `{ id: string, name: string, completedToday: boolean, streak: number }`) | Array de objetos de hábitos a mostrar.                                      |
    | `onToggleHabit` | `(habitId: string) => void`      | Función callback para marcar un hábito como completado/incompleto.          |
    | `onAddHabit`    | `(habitName: string) => void`    | Función callback para añadir un nuevo hábito.                               |
*   **Ejemplo de Uso (Conceptual):**
    *   Se muestra como una tarjeta o sección dentro de la pantalla del Dashboard. Permite al usuario ver sus hábitos, marcarlos y añadir nuevos. Los datos se obtendrían de Supabase a través de un hook de `react-query`.

---

*(Listar y describir otros componentes UI clave del proyecto uWuzi-Assist, adaptando la estructura según sea necesario.)*

## Componentes/Módulos de Lógica (Backend/Core - Conceptual)

A continuación, se describen los módulos de lógica de negocio principales o servicios conceptuales dentro de la pila de backend local de uWuzi-Assist.

---

### Módulo: `Servicio FastAPI`

*   **Responsabilidad Única:** Actuar como el API Gateway principal. Valida las solicitudes entrantes de la aplicación móvil, las enruta al servicio interno apropiado (n8n para tareas agénticas, Ollama para chat directo), procesa las respuestas y las devuelve al cliente.
*   **Métodos Públicos/API (Endpoints Conceptuales):**
    *   `POST /api/v1/chat/completion`: Recibe un mensaje de chat, lo envía a Ollama, y devuelve la respuesta del LLM.
    *   `POST /api/v1/agent/execute`: Recibe un comando para el agente, lo envía a un webhook de n8n, y devuelve el resultado del flujo de trabajo.
    *   `GET /api/v1/dashboard/data`: (Ejemplo) Obtiene datos agregados o específicos para los widgets del dashboard desde Supabase.
    *   `POST /api/v1/config/settings`: (Ejemplo) Permite a la app móvil guardar/actualizar configuraciones que se persisten en Supabase.
*   **Dependencias:**
    *   `n8n` (para disparar flujos de trabajo).
    *   `Ollama` (para interactuar con LLMs locales).
    *   `Supabase` (para acceder/almacenar datos).

---

### Módulo: `Servicio de Workflows n8n`

*   **Responsabilidad Única:** Ejecutar tareas agénticas complejas y flujos de trabajo automatizados. Estos flujos pueden involucrar múltiples pasos, lógica condicional, interacción con LLMs (Ollama) y, potencialmente, llamadas a APIs de terceros (si el usuario las configura).
*   **Métodos Públicos/API (Conceptual):**
    *   Principalmente activado por webhooks desde FastAPI. Cada webhook puede corresponder a un tipo de tarea agéntica (ej: `webhook/calendar_agent`, `webhook/todo_agent`).
    *   Puede exponer otros endpoints si n8n necesita ser consultado directamente por FastAPI para estados de tareas largas (aunque la comunicación suele ser unidireccional: FastAPI -> n8n -> FastAPI vía respuesta del webhook).
*   **Dependencias:**
    *   `Ollama` (para capacidades de IA dentro de los flujos de trabajo).
    *   Servicios externos (ej: APIs de calendario, email, etc., si se integran nodos para ellos).
    *   `Supabase` (para leer/escribir datos relevantes para los flujos de trabajo, como configuraciones de usuario para una tarea o logs de ejecución).

---

### Módulo: `Servicio de Modelo de Lenguaje Ollama`

*   **Responsabilidad Única:** Proporcionar acceso a modelos de lenguaje grandes (LLMs) que se ejecutan localmente. Maneja la carga de modelos, la generación de texto, y potencialmente otras capacidades como embeddings.
*   **Métodos Públicos/API (Conceptual, accedida vía su propia API HTTP):**
    *   Endpoint de generación de texto (ej: `/api/generate`): Recibe un prompt y devuelve la continuación generada por el LLM.
    *   Endpoint de chat (ej: `/api/chat`): Similar a generate pero optimizado para conversaciones multi-turno.
    *   (Otros endpoints que Ollama exponga para listar modelos, crear embeddings, etc.).
*   **Dependencias:**
    *   Archivos de los modelos de lenguaje descargados por el usuario.

---

### Módulo: `Servicio de Almacén de Datos Supabase`

*   **Responsabilidad Única:** Gestionar la persistencia de todos los datos de la aplicación. Esto incluye el historial de conversaciones, configuraciones del usuario/aplicación, datos necesarios para los widgets del dashboard (como hábitos, gastos, etc.), y cualquier otro dato que necesiten FastAPI o n8n.
*   **Métodos Públicos/API (Conceptual, accedida vía SQL o la API de Supabase si FastAPI/n8n la usan):**
    *   Operaciones CRUD (Crear, Leer, Actualizar, Eliminar) para sus tablas (ej: `conversations`, `settings`, `habits`, `expenses`).
    *   Potencialmente funciones de base de datos (PostgreSQL functions) para lógica de datos más compleja.
*   **Dependencias:**
    *   Motor de base de datos PostgreSQL.

---

Estos módulos trabajan en conjunto, orquestados por Docker, para proveer la funcionalidad completa de uWuzi-Assist de manera local y privada.
