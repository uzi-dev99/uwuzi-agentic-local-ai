# 2. Estructura de Carpetas

La organización del código fuente está diseñada para ser intuitiva y escalable. Cada directorio tiene una responsabilidad clara.

```
/
├── components/
│   ├── icons/
│   │   └── *.tsx
│   ├── AiLogo.tsx
│   ├── CameraModal.tsx
│   ├── ChatHeader.tsx
│   ├── ChatList.tsx
│   ├── FloatingActionButton.tsx
│   ├── HomeHeader.tsx
│   ├── MessageContent.tsx
│   ├── MessageInput.tsx
│   ├── MessageList.tsx
│   └── Sidebar.tsx
├── contexts/
│   ├── ChatContext.tsx
│   └── SidebarContext.tsx
├── docs/
│   └── *.md
├── hooks/
│   ├── useAudioRecorder.ts
│   ├── useFileUpload.ts
│   └── useLocalStorage.ts
├── pages/
│   ├── ChatPage.tsx
│   ├── ConfigPage.tsx
│   └── HomePage.tsx
├── services/
│   └── backendService.ts
├── types.ts
├── App.tsx
├── index.html
└── index.tsx
```

### Descripción de Directorios

-   **`components/`**: Contiene todos los componentes de React reutilizables.
    -   **`icons/`**: Un subdirectorio para todos los componentes de iconos SVG. Son componentes ligeros y optimizados.
    -   El resto de archivos son los bloques de construcción de la interfaz, como `Sidebar`, `MessageList`, etc.

-   **`contexts/`**: Aquí reside la gestión de estado global de la aplicación utilizando el API de Context de React.
    -   `ChatContext.tsx`: Gestiona todo el estado relacionado con los chats, carpetas, mensajes y etiquetas.
    -   `SidebarContext.tsx`: Gestiona el estado de apertura/cierre de la barra lateral en la vista móvil.

-   **`docs/`**: Contiene toda la documentación del proyecto en formato Markdown.

-   **`hooks/`**: Almacena los hooks personalizados de React que encapsulan lógica compleja y reutilizable.
    -   `useAudioRecorder.ts`: Lógica para la grabación de audio.
    -   `useFileUpload.ts`: Lógica para la carga y lectura de archivos.
    -   `useLocalStorage.ts`: Un hook genérico para sincronizar el estado con el almacenamiento local del navegador.

-   **`pages/`**: Cada archivo representa una vista o "pantalla" completa de la aplicación, como la página de inicio (`HomePage`) o la página de un chat individual (`ChatPage`).

-   **`services/`**: Módulos que encapsulan la comunicación con APIs externas.
    -   `backendService.ts`: Contiene toda la lógica para interactuar con el backend personalizado, incluyendo la gestión de respuestas en streaming y la comunicación con el agente de IA.

-   **`types.ts`**: Define todas las interfaces y tipos de TypeScript compartidos en la aplicación (`Message`, `Chat`, `Folder`, etc.).

-   **`App.tsx`**: El componente raíz de la aplicación. Configura los proveedores de contexto y el enrutador.

-   **`index.html`**: El punto de entrada HTML de la aplicación. Incluye la configuración de Tailwind CSS y la importación de los módulos de JavaScript.

-   **`index.tsx`**: El punto de entrada de React, donde la aplicación se monta en el DOM.
