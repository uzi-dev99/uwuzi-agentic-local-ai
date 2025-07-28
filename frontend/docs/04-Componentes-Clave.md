# 4. Componentes Clave

La aplicación está construida con un sistema de componentes modulares y reutilizables. A continuación se describen los más importantes.

### Componentes de Layout

-   **`App.tsx`**: El componente raíz que envuelve toda la aplicación. Es responsable de:
    -   Inicializar los proveedores de contexto (`ChatProvider`, `SidebarProvider`).
    -   Configurar el enrutador (`HashRouter`).
    -   Definir el layout principal (Sidebar + Contenido principal).

-   **`Sidebar.tsx`**: La barra lateral para la navegación.
    -   Muestra los filtros ("All Chats"), la lista de carpetas y la lista de etiquetas.
    -   Permite la creación de nuevas carpetas y nuevos chats.
    -   Su estado de visibilidad en móvil es controlado por `SidebarContext`.

-   **`HomeHeader.tsx` y `ChatHeader.tsx`**: Las cabeceras de las vistas principal y de chat, respectivamente. Muestran títulos, botones de navegación y acciones contextuales.

### Componentes de Página

-   **`HomePage.tsx`**: La pantalla de inicio o "dashboard".
    -   Contiene el `HomeHeader` y el `ChatList`.
    -   Gestiona el estado del filtro activo (`activeFilter`) para decidir qué chats mostrar.
    -   Incluye el `FloatingActionButton` para un acceso rápido a la creación de chats.

-   **`ChatPage.tsx`**: La pantalla principal de interacción.
    -   Orquesta la comunicación entre la lista de mensajes y la entrada de texto.
    -   Llama al `backendService` para enviar mensajes y recibir respuestas del agente de IA.
    -   Gestiona el estado de carga (`isLoading`).

-   **`ConfigPage.tsx`**: La página de configuración.
    -   Permite al usuario realizar acciones como limpiar todos los datos de la aplicación.

### Componentes de UI

-   **`ChatList.tsx`**: Muestra la lista de conversaciones.
    -   Filtra los chats según el `activeFilter` recibido de `HomePage`.
    -   Permite renombrar y eliminar chats directamente desde la lista.
    -   Gestiona el truncamiento de texto para evitar desbordamientos visuales.

-   **`MessageList.tsx`**: Renderiza la lista de mensajes dentro de un chat.
    -   Se desplaza automáticamente al último mensaje.
    -   Utiliza `MessageContent` para renderizar el contenido de cada mensaje.
    -   Maneja la visualización del indicador de "escribiendo..." de la IA.

-   **`MessageInput.tsx`**: El campo de entrada multifuncional.
    -   Permite enviar texto, grabar audio, adjuntar archivos y tomar fotos.
    -   Utiliza los hooks `useAudioRecorder` y `useFileUpload` para encapsular la lógica compleja.
    -   Muestra una previsualización de los archivos adjuntos.

-   **`MessageContent.tsx`**: El componente más crítico para la visualización de mensajes.
    -   Renderiza texto plano.
    -   Interpreta y formatea Markdown usando `react-markdown`.
    -   Resalta la sintaxis de los bloques de código con `react-syntax-highlighter`.
    -   Muestra imágenes, previsualizaciones de archivos adjuntos y maneja errores.

-   **`CameraModal.tsx`**: Un modal que utiliza la cámara del dispositivo para capturar y enviar una foto.

### Componentes de Iconos (`components/icons/`)

Son componentes SVG puros, optimizados para un rendimiento rápido y un estilizado fácil a través de props `className`. Ejemplos: `SendIcon`, `TrashIcon`, `FolderIcon`.
