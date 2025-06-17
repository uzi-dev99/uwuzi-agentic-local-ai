# /DOCS/05_VISTAS_Y_PANTALLAS.md: Vistas y Pantallas de uWuzi-Assist

Este documento describe las pantallas (vistas) principales de la aplicación "uWuzi-Assist". La navegación principal se gestiona en `src/pages/Index.tsx`, que actúa como un despachador de vistas basado en los parámetros de búsqueda de la URL (ej: `/?view=home`).

---

## Pantalla: `HomeView` (Vista Principal de Chats)

*   **Ruta:** `/` con `?view=home` (o por defecto si el usuario está "logueado" y no se especifica ninguna vista).
*   **Propósito y Funcionalidad:**
    *   Es la interfaz principal para listar, filtrar y gestionar conversaciones (chats) y carpetas.
    *   Permite al usuario buscar chats por término, filtrar por etiquetas asignadas a los chats y organizar los chats en carpetas.
    *   Facilita la creación de nuevos chats y la gestión de carpetas (crear, eliminar).
*   **Wireframe/Mockup Conceptual:**
    ```
    +-------------------------------------------------------------------+
    | HomeSidebar (Carpetas, Nueva Carpeta) | Main Content Area         |
    |                                       |---------------------------|
    |                                       | HomeHeader (Título Carpeta) |
    |                                       |---------------------------|
    |                                       | ChatFilters (Buscar, Tags)|
    |                                       |---------------------------|
    |                                       | ChatList (Items de Chat)  |
    |                                       |                           |
    |                                       |                           |
    |                                       | NewChatButton (Flotante)  |
    +-------------------------------------------------------------------+
    ```
*   **Componentes Utilizados Clave:**
    *   `HomeSidebar` (`src/components/HomeSidebar.tsx`): Para navegación entre carpetas y creación/eliminación de las mismas.
    *   `HomeHeader` (`src/components/home/HomeHeader.tsx`): Muestra el título de la carpeta actual o "Conversaciones".
    *   `ChatFilters` (`src/components/home/ChatFilters.tsx`): Contiene el campo de búsqueda y el selector de etiquetas.
    *   `ChatList` (`src/components/home/ChatList.tsx`): Muestra la lista filtrada de chats.
    *   `NewChatButton` (`src/components/home/NewChatButton.tsx`): Botón flotante para iniciar un nuevo chat.
*   **Estado Manejado:**
    *   `selectedFolderId`: (String | null) ID de la carpeta actualmente seleccionada (manejado como prop desde `Index.tsx`).
    *   `searchTerm`: (String) Término de búsqueda actual para filtrar chats.
    *   `selectedTags`: (Array<String>) Etiquetas seleccionadas para filtrar chats.
    *   `chats`: (Array<Chat>) Lista de chats, obtenida mediante `@tanstack/react-query` desde `api.fetchChats()`.
    *   `folders`: (Array<Folder>) Lista de carpetas, obtenida mediante `@tanstack/react-query` desde `api.fetchFolders()`.
*   **Eventos y Acciones:**
    *   Seleccionar una carpeta en `HomeSidebar` actualiza `selectedFolderId` y filtra `ChatList`.
    *   Escribir en el campo de búsqueda de `ChatFilters` actualiza `searchTerm` y filtra `ChatList`.
    *   Seleccionar/deseleccionar etiquetas en `ChatFilters` actualiza `selectedTags` y filtra `ChatList`.
    *   Clic en `NewChatButton` navega a `ChatView` para un nuevo chat, pasando el `folderId` actual si existe.
    *   Crear/Eliminar carpetas a través de `HomeSidebar`.
    *   Eliminar chats o actualizar sus etiquetas directamente desde `ChatList`.

---

## Pantalla: `ChatView` (Vista de Interacción de Chat)

*   **Ruta:** `/` con `?view=chat&id=:chatId` (puede incluir opcionalmente `&folderId=:folderId`).
*   **Propósito y Funcionalidad:**
    *   Es la interfaz principal para la interacción conversacional directa con la IA (a través de Ollama) o para enviar comandos en modo 'agente' (que se procesan a través de n8n).
    *   Muestra el historial de la conversación actual.
    *   Provee un campo de entrada para que el usuario escriba mensajes o comandos.
    *   Maneja la visualización de respuestas de la IA e indicadores de estado (ej: escribiendo, tarea de agente en proceso).
*   **Wireframe/Mockup Conceptual:**
    ```
    +---------------------------------------------------+
    | ChatHeader (Título Chat, Botón Volver)            |
    +---------------------------------------------------+
    | MessageArea (Scrollable)                          |
    |  [MessageBubble (Usuario)]                        |
    |  [MessageBubble (Asistente)]                      |
    |  [TypingIndicator / LongProcessIndicator]         |
    |  ...                                              |
    +---------------------------------------------------+
    | Footer (ChatInput: Texto, selector Modo, Enviar)  |
    +---------------------------------------------------+
    ```
*   **Componentes Utilizados Clave:**
    *   `ChatHeader` (`src/components/chat/ChatHeader.tsx`): Muestra el título del chat (editable) y un botón para volver a `HomeView`.
    *   `MessageArea` (`src/components/chat/MessageArea.tsx`): Contenedor para los mensajes, maneja el scroll y los indicadores.
    *   `MessageBubble` (`src/components/MessageBubble.tsx`): Muestra un mensaje individual.
    *   `ChatInput` (`src/components/ChatInput.tsx`): Campo de entrada de mensajes, selector de modo (chat/agente), y botón de envío.
    *   `TypingIndicator` (`src/components/chat/TypingIndicator.tsx`): Muestra que la IA está "escribiendo".
    *   `LongProcessIndicator` (`src/components/chat/LongProcessIndicator.tsx`): Muestra que una tarea de agente está en curso.
*   **Estado Manejado (principalmente a través del hook `useChat`):**
    *   `messages`: (Array<Message>) Historial de mensajes de la conversación actual.
    *   `chatTitle`: (String) Título del chat actual.
    *   `chatMode`: ('chat' | 'agent') Modo actual de operación.
    *   `isSending`: (Boolean) Estado de carga mientras se envía un mensaje.
    *   `isTyping`: (Boolean) Estado que indica si la IA está generando una respuesta.
    *   `isWaitingLongResponse`: (Boolean) Estado para tareas de agente que pueden tomar más tiempo.
*   **Eventos y Acciones:**
    *   Enviar un mensaje/comando a través de `ChatInput`.
    *   Recibir y mostrar respuestas de la IA o resultados del agente en `MessageArea`.
    *   Cambiar el `chatMode` (chat/agente) usando el selector en `ChatInput`.
    *   Editar y guardar el título del chat en `ChatHeader`.
    *   Cancelar un proceso de agente en curso a través de `LongProcessIndicator`.

---

## Pantalla: `DashboardView` (Vista de Dashboard Personal)

*   **Ruta:** `/` con `?view=dashboard`.
*   **Propósito y Funcionalidad:**
    *   Proporciona un dashboard personal para que el usuario visualice datos relevantes de forma local.
    *   Actualmente incluye widgets como un calendario, un gráfico de gastos (conceptual) y una lista de tareas.
    *   El usuario mencionó la posibilidad de que Ollama/n8n interpreten datos para generar informes o insights en el futuro.
    *   También incluye la `HomeSidebar` para una navegación consistente.
*   **Wireframe/Mockup Conceptual:**
    ```
    +-------------------------------------------------------------------+
    | HomeSidebar (Carpetas)            | Main Content Area             |
    |                                   |-------------------------------|
    |                                   | DashboardHeader (Título)      |
    |                                   |-------------------------------|
    |                                   | [CalendarWidget] [TodoWidget] |
    |                                   | [ExpenseChartWidget]          |
    |                                   | [DayDetailPanel (si fecha sel.)]|
    +-------------------------------------------------------------------+
    ```
*   **Componentes Utilizados Clave:**
    *   `HomeSidebar` (`src/components/HomeSidebar.tsx`): Para navegación y gestión de carpetas.
    *   `DashboardHeader` (`src/components/dashboard/DashboardHeader.tsx`): Título de la vista.
    *   `CalendarWidget` (`src/components/dashboard/CalendarWidget.tsx`): Muestra un calendario, permite seleccionar fechas.
    *   `ExpenseChartWidget` (`src/components/dashboard/ExpenseChartWidget.tsx`): (Conceptual) Mostraría gráficos de gastos.
    *   `TodoWidget` (`src/components/dashboard/TodoWidget.tsx`): Para gestionar una lista de tareas.
    *   `DayDetailPanel` (`src/components/dashboard/DayDetailPanel.tsx`): Panel que aparece al seleccionar una fecha en `CalendarWidget`, mostrando detalles o eventos de ese día.
    *   `Drawer` (de `shadcn/ui`): Usado para mostrar `DayDetailPanel` en móviles.
*   **Estado Manejado:**
    *   `selectedDate`: (Date | undefined) Fecha seleccionada en `CalendarWidget` para mostrar `DayDetailPanel`.
    *   Datos para los widgets (ej: tareas para `TodoWidget`, eventos para `CalendarWidget`), que serían obtenidos de Supabase a través de `@tanstack/react-query` (no completamente implementado en el extracto).
    *   `folders`: (Array<Folder>) Lista de carpetas para `HomeSidebar`.
*   **Eventos y Acciones:**
    *   Seleccionar una fecha en `CalendarWidget` para mostrar/ocultar `DayDetailPanel`.
    *   Interactuar con los widgets (ej: añadir/completar tareas en `TodoWidget`).
    *   Gestión de carpetas a través de `HomeSidebar`.

---

## Pantalla: `SettingsView` (Vista de Configuración)

*   **Ruta:** `/` con `?view=settings`.
*   **Propósito y Funcionalidad:**
    *   Permite al usuario (administrador) configurar aspectos de la aplicación.
    *   Incluye campos para la URL del endpoint del backend y la API Key (actualmente guardados en `localStorage`).
    *   Permite la personalización del perfil de usuario (nombre, avatar) y el logo de la aplicación (si es admin).
    *   Ofrece un selector de tema (oscuro/claro).
    *   Incluye un diálogo para monitorizar procesos de agente (`ProcessMonitorDialog`).
*   **Wireframe/Mockup Conceptual:**
    ```
    +---------------------------------------------------+
    | SettingsHeader (Título, Botón Volver)             |
    +---------------------------------------------------+
    | [Sección Perfil: Avatar, Nombre Usuario]          |
    |---------------------------------------------------|
    | [Sección Logo App (Admin): Upload, Preview]       |
    |---------------------------------------------------|
    | [Sección Apariencia: Selector Tema Dark/Light]    |
    |---------------------------------------------------|
    | [Sección Monitor: Abrir ProcessMonitorDialog]     |
    |---------------------------------------------------|
    | [Sección API: Input URL, Input API Key]           |
    |---------------------------------------------------|
    | [Botón Guardar Cambios]                           |
    +---------------------------------------------------+
    ```
*   **Componentes Utilizados Clave:**
    *   `Input`, `Label`, `Button`, `Switch`, `Avatar` (de `shadcn/ui` o componentes base).
    *   `ProcessMonitorDialog` (`src/components/settings/ProcessMonitorDialog.tsx`): Para ver el estado de procesos de agente.
*   **Estado Manejado (local y a través del hook `useAuth`):**
    *   `apiUrl`: (String) URL del backend.
    *   `apiKey`: (String) API Key para el backend.
    *   `username`, `avatar`: (String) Datos del perfil del usuario.
    *   `logoPreview`: (String | null) Previsualización del logo de la app subido.
    *   `appLogo`: (String | null) Logo actual de la app (de `useAuth`).
    *   `theme`: ('dark' | 'light') Tema actual (de `useAuth`).
    *   `isMonitorOpen`: (Boolean) Visibilidad del diálogo de monitor.
*   **Eventos y Acciones:**
    *   Modificar los campos de configuración (API URL, API Key, perfil).
    *   Guardar los cambios, lo que actualiza `localStorage` y el estado de `useAuth`.
    *   Subir y guardar un nuevo logo para la aplicación (solo admin).
    *   Cambiar el tema de la aplicación (oscuro/claro).
    *   Abrir el `ProcessMonitorDialog`.

---

Estas vistas constituyen el núcleo de la interfaz de usuario de "uWuzi-Assist", proporcionando las herramientas para la interacción con la IA, la gestión de conversaciones y la personalización de la aplicación.
