# 7. Cómo Escalar el Proyecto

Esta guía proporciona ejemplos prácticos sobre cómo añadir nuevas funcionalidades a la aplicación, siguiendo los patrones y la arquitectura existentes.

### Ejemplo 1: Añadir una nueva opción de configuración

Supongamos que queremos añadir un interruptor en la `ConfigPage` para activar/desactivar un "Modo Compacto" en la lista de mensajes.

1.  **Actualizar el Estado Global (`ChatContext.tsx`)**:
    -   Añadir el nuevo estado al `ChatContextType`: `isCompactMode: boolean;` y `toggleCompactMode: () => void;`.
    -   En `ChatProvider`, crear el estado usando `useLocalStorage` para que la preferencia sea persistente:
        ```javascript
        const [isCompactMode, setIsCompactMode] = useLocalStorage('settings_compact_mode', false);
        const toggleCompactMode = () => setIsCompactMode(prev => !prev);
        ```
    -   Añadir `isCompactMode` y `toggleCompactMode` al objeto `value` del proveedor.

2.  **Añadir el Componente de UI (`ConfigPage.tsx`)**:
    -   Usar el `useChatStore()` para acceder a `isCompactMode` y `toggleCompactMode`.
    -   Crear un interruptor (toggle switch) en el JSX que muestre el estado actual y llame a `toggleCompactMode` al hacer clic.

3.  **Aplicar el Nuevo Estado (`MessageList.tsx`)**:
    -   Usar el `useChatStore()` para acceder a `isCompactMode`.
    -   En el JSX del componente, aplicar clases de Tailwind condicionalmente para cambiar el espaciado o el tamaño de los elementos:
        ```jsx
        <div className={`space-y-6 ${isCompactMode ? 'space-y-2' : 'space-y-6'}`}>
          {/* ... */}
        </div>
        ```

### Ejemplo 2: Añadir un nuevo tipo de archivo legible (ej. `.json`)

Supongamos que queremos que la IA pueda leer y analizar archivos JSON.

1.  **Actualizar el Lector de Archivos (`hooks/useFileUpload.ts`)**:
    -   Añadir `.json` y `application/json` a las comprobaciones para identificar el tipo de archivo.
    -   Asegurarse de que el `FileReader` utilice `readAsText(file)` para los archivos JSON, igual que para los archivos `.txt` y `.md`.
    -   Devolver `{ type: 'text', readable: true, ... }` para los archivos JSON.

2.  **Actualizar la Lógica de Envío (`services/backendService.ts`)**:
    -   El servicio ya está diseñado para manejar `apiContent` como texto plano, por lo que probablemente no necesite cambios. El contenido del JSON se enviará al agente de IA como parte del prompt.

3.  **Actualizar el Input de Archivos (`components/MessageInput.tsx`)**:
    -   Añadir `.json` a la prop `accept` del `<input type="file">` para que el selector de archivos del sistema operativo lo muestre por defecto.

### Principios para Escalar

-   **Abstracción en Hooks**: Si una lógica es compleja y podría reutilizarse (como la grabación de audio), encapsúlala en un hook personalizado.
-   **Estado Centralizado**: Cualquier estado que necesite ser compartido por múltiples componentes debe residir en `ChatContext` (si es de datos) o en un nuevo contexto (si es de UI no persistente).
-   **Componentes Pequeños y Enfocados**: Mantén los componentes con una única responsabilidad. Si un componente se vuelve demasiado grande, divídelo en componentes más pequeños.
-   **Tipado Estricto**: Define siempre las interfaces y tipos en `types.ts` antes de implementar la funcionalidad.
-   **Documentación**: Al añadir una nueva funcionalidad importante, considera añadir una sección a esta documentación.
