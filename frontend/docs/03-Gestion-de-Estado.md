# 3. Gestión de Estado

La gestión de estado en esta aplicación es centralizada y persistente, utilizando una combinación del API de Context de React y un hook personalizado `useLocalStorage`.

### Principios

-   **Centralización**: El estado global (chats, carpetas, etc.) se gestiona en un único lugar (`ChatContext`) para evitar la dispersión de la lógica y facilitar el seguimiento de los datos.
-   **Persistencia**: Todo el estado crítico del usuario se guarda en el `localStorage` del navegador. Esto significa que los chats, carpetas y configuraciones no se pierden al recargar la página, proporcionando una experiencia de usuario fluida y continua.
-   **Reactividad**: Los componentes se suscriben al contexto y se actualizan automáticamente cuando el estado cambia.

### `useLocalStorage` Hook

Es un hook genérico que abstrae la lógica de leer y escribir en el `localStorage`.

-   **Sintaxis**: `const [value, setValue] = useLocalStorage(key, initialValue);`
-   **Funcionamiento**:
    1.  Al inicializarse, intenta leer el valor desde `localStorage` usando la `key` proporcionada.
    2.  Si no encuentra nada, utiliza el `initialValue`.
    3.  Cada vez que el `value` cambia (a través de `setValue`), el hook actualiza automáticamente el `localStorage`.
    4.  Maneja la serialización (`JSON.stringify`) y deserialización (`JSON.parse`) de los datos de forma transparente.

### `ChatContext`

Es el proveedor de estado principal de la aplicación.

-   **Responsabilidades**:
    -   Gestionar el estado de los `chats` y `folders`.
    -   Proporcionar funciones para manipular este estado (CRUD: `createChat`, `renameChat`, `deleteChat`, `createFolder`, etc.).
    -   Utiliza `useLocalStorage` para hacer persistentes los chats y las carpetas.
-   **Inicialización y Migración**: En su `useEffect` de inicialización, `ChatContext` no solo carga los datos, sino que también puede realizar **migraciones de datos**. Por ejemplo, al añadir una nueva propiedad como `tags` a la interfaz `Chat`, el contexto se encarga de que los chats antiguos guardados en `localStorage` sean actualizados al nuevo formato, garantizando la retrocompatibilidad.

### `SidebarContext`

Es un contexto mucho más simple, enfocado únicamente en la interfaz de usuario.

-   **Responsabilidad**: Gestionar el estado de la barra lateral (abierta o cerrada) en la vista móvil.
-   **Justificación**: Se separa de `ChatContext` porque el estado de la UI no necesita ser persistente y tiene un ámbito de influencia más limitado.

### Flujo de Actualización

1.  Un componente de la interfaz (ej. `MessageInput`) llama a una función del `useChatStore()` (ej. `addMessage`).
2.  La función `addMessage` en `ChatContext` actualiza el estado de los `chats`.
3.  El cambio de estado dispara el `useEffect` del hook `useLocalStorage`, que guarda la nueva lista de chats en el almacenamiento local.
4.  Todos los componentes suscritos a `ChatContext` que utilizan la lista de `chats` (ej. `MessageList`) se vuelven a renderizar con los nuevos datos.
