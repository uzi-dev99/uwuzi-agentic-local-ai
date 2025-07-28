# 6. Guía de Estilos

La consistencia visual es un pilar fundamental del proyecto. Se logra a través de Tailwind CSS y una paleta de colores bien definida.

### Tailwind CSS

-   **Enfoque**: Se utiliza un enfoque "utility-first", aplicando clases directamente en los componentes JSX. Esto mantiene los estilos co-localizados con el marcado y facilita el desarrollo rápido.
-   **Configuración**: La configuración de Tailwind se realiza directamente en un script dentro del `<head>` del `index.html`. Este método es simple y efectivo para proyectos que no requieren un proceso de construcción complejo (build step).

### Paleta de Colores

La paleta de colores personalizada se define dentro de `tailwind.config`.

```javascript
tailwind.config = {
  theme: {
    extend: {
      colors: {
        'primary': '#111827',        // Fondo principal oscuro
        'secondary': '#1F2937',      // Fondo para elementos secundarios (burbujas de IA, inputs)
        'user-bubble': '#047857',   // Fondo para las burbujas de mensaje del usuario
        'accent-violet': '#8b5cf6', // Acento principal para la vista de chat
        'accent-green': '#10b981',  // Acento principal para la vista de inicio/sidebar
        'light': '#E5E7EB',         // Color de texto principal
        'muted': '#6B7281',         // Color para textos secundarios y elementos desactivados
        'danger': '#ef4444'         // Color para acciones destructivas (eliminar)
      }
    }
  }
}
```

### Lógica de Colores por Vista

Para crear una distinción visual clara, se sigue una regla simple:

-   **Vista Principal (`HomePage`, `Sidebar`, `ChatList`)**: Utiliza `accent-green` como color de acento principal para botones, filtros activos, y estados de foco.
-   **Vista de Chat (`ChatPage`)**: Utiliza `accent-violet` como color de acento principal para etiquetas, el modo de chat, y otros elementos interactivos.

### Tipografía

Se utilizan las fuentes estándar del sistema (`font-sans`) para un rendimiento óptimo y una apariencia nativa en todos los dispositivos. El tamaño de la fuente se gestiona con las utilidades de Tailwind (`text-sm`, `text-base`, `text-lg`, etc.).

### Barra de Desplazamiento Personalizada

Para mantener la estética inmersiva, se ha implementado una barra de desplazamiento personalizada a nivel global directamente en `index.html`.

-   Utiliza los colores `primary` y `muted` de la paleta.
-   El estado `hover` cambia al color `accent-green`, en línea con el tema de la vista principal.
-   Se han añadido reglas tanto para navegadores WebKit (Chrome, Edge, Safari) como para Firefox para una máxima compatibilidad.

### Clases Reutilizables y "Component-driven CSS"

Aunque el enfoque es "utility-first", se fomenta la creación de componentes reutilizables que encapsulen tanto el marcado como los estilos. Por ejemplo, en lugar de repetir las clases para un botón, se crea un componente `Button` que acepta props para sus variantes. Esto mantiene el código base limpio (DRY - Don't Repeat Yourself).
