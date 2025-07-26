# /DOCS/04_ESTILOS_Y_UI.md: Estilos y UI de uWuzi-Assist

Este documento define el sistema de diseño y las convenciones de estilo utilizadas en el proyecto "uWuzi-Assist". El objetivo es asegurar una interfaz de usuario coherente, accesible y fácil de mantener, con un fuerte énfasis en el modo oscuro.

## Sistema de Diseño (Design System)

El sistema de diseño de "uWuzi-Assist" se basa en Tailwind CSS y `shadcn/ui`, priorizando la utilidad y la composición.

### Paleta de Colores

La aplicación está diseñada con un enfoque **primario en el modo oscuro**. El modo claro está definido pero no es la prioridad actual.

*   **Colores Temáticos Principales (Modo Oscuro):**
    *   **Violeta Primario (`primary`):** `hsl(var(--primary))` - `265 90% 60%`. Utilizado para acciones principales, enfoque y elementos interactivos.
    *   **Verde Acento (`accent`):** `hsl(var(--accent))` - `145 100% 60%`. Un verde vibrante (estilo "Halloween") para llamadas a la acción secundarias o elementos destacados.
    *   **Azules Oscuros y Grises (`background`, `card`, `secondary`, `border`):**
        *   `background`: `hsl(var(--background))` - `25 10% 12%` (fondo principal, muy oscuro, casi negro).
        *   `card`: `hsl(var(--card))` - `222.2 84% 4.9%` (fondo para tarjetas, también muy oscuro).
        *   `secondary`: `hsl(var(--secondary))` - `217.2 32.6% 13.5%` (utilizado para la burbuja del bot, un azul-gris oscuro).
        *   `border`: `hsl(var(--border))` - `217.2 32.6% 25.5%` (para bordes sutiles).
    *   **Texto Principal (`foreground`):** `hsl(var(--foreground))` - `210 40% 98%` (un gris claro/casi blanco para asegurar contraste).
    *   **Texto Secundario/Muted (`muted-foreground`):** `hsl(var(--muted-foreground))` - `215 20.2% 65.1%`.

*   **Mapeo Semántico de Tailwind:**
    *   Los colores están definidos como variables CSS en `src/index.css` y mapeados en `tailwind.config.ts` a nombres semánticos de Tailwind (ej: `primary`, `secondary`, `accent`, `background`, `foreground`, `card`, `border`, `input`, `ring`, `destructive`, `muted`).
    *   Esto permite una aplicación consistente a través de las utilidades de Tailwind (ej: `bg-primary`, `text-accent`).

*   **Modo Claro:**
    *   Aunque definido en `src/index.css`, el modo claro no es la prioridad de desarrollo actual. Los colores son generalmente inversiones o adaptaciones de la paleta oscura.

### Tipografía

*   **Fuente Principal:**
    *   **Nombre de la Fuente:** `Inter`. Importada vía Google Fonts en `src/index.css`.
    *   **Aplicación:** Definida como la fuente `sans` por defecto en `tailwind.config.ts`, aplicándose a todo el cuerpo del texto y la UI.
*   **Jerarquía de Texto:**
    *   La jerarquía de texto (h1-h6, p, etc.) se maneja principalmente a través de las clases de utilidad de Tailwind CSS y el plugin `@tailwindcss/typography`.
    *   El componente `MarkdownRenderer` utiliza las clases `prose` y `prose-invert` (con personalizaciones en `src/index.css`) para dar estilo al contenido Markdown generado por la IA, asegurando que la tipografía sea consistente con el tema.
    *   Los tamaños de fuente, pesos y alturas de línea se basan en la escala por defecto de Tailwind, personalizables mediante utilidades (ej: `text-lg`, `font-semibold`, `leading-relaxed`).

### Espaciado y Rejilla (Grid)

*   **Unidad Base de Espaciado:**
    *   El sistema de espaciado se basa en la escala por defecto de Tailwind CSS, donde `1 unidad = 0.25rem (4px)`. (Ej: `p-4` es `1rem` o `16px` de padding, `m-2` es `0.5rem` o `8px` de margen).
*   **Sistema de Rejilla (Grid System):**
    *   El layout se gestiona principalmente mediante las utilidades de Flexbox (`flex`, `items-center`, `justify-between`, etc.) y CSS Grid (`grid`, `grid-cols-2`, `gap-4`, etc.) proporcionadas por Tailwind CSS.
    *   El componente `container` de Tailwind está configurado en `tailwind.config.ts` para centrar contenido con un padding de `2rem` y un ancho máximo de `1400px` en pantallas `2xl`.

### Iconografía

*   **Biblioteca de Iconos:** `lucide-react`.
*   **Método de Uso:**
    *   Los iconos de `lucide-react` se importan como componentes React individuales directamente en los archivos `.tsx` donde se necesitan.
    *   Ejemplo: `import { IconName } from 'lucide-react'; <IconName size={24} className="text-primary" />`.
*   **Tamaños y Estilos:**
    *   El tamaño y color de los iconos se controlan mediante props (`size`) y clases de utilidad de Tailwind CSS (`className`).

## Estructura de Estilos (CSS/SCSS)

Describe la metodología y organización de los archivos de estilos.

### Metodología de Estilos

*   **Tailwind CSS:** Es la metodología principal, enfocada en "utility-first". Los estilos se aplican directamente en el HTML (JSX) mediante clases de utilidad.
*   **`class-variance-authority` (cva):** Se utiliza para crear variantes de componentes de UI (especialmente los de `shadcn/ui` y componentes personalizados que requieren múltiples estados o estilos). Permite definir estilos base y variantes de forma organizada.
*   **`clsx` y `tailwind-merge`:** Se utilizan a través de la utilidad `cn` (definida en `src/lib/utils.ts`) para construir condicionalmente listas de clases y fusionar inteligentemente clases de Tailwind sin conflictos.

### Estructura de Archivos de Estilos

*   **Estilos Globales y Base:** `src/index.css` es el archivo principal donde se importan las fuentes, se definen las capas base de Tailwind (`@tailwind base; @tailwind components; @tailwind utilities;`), y se establecen las variables CSS globales para el tema (colores, radio de borde) tanto para el modo oscuro como para el claro. También contiene estilos base para `body`, scrollbars personalizados y las clases `prose` para Markdown.
*   **Estilos de Componentes:**
    *   Para componentes de `shadcn/ui`, los estilos son principalmente clases de utilidad de Tailwind aplicadas directamente en su estructura JSX.
    *   Para componentes personalizados (ej: `ChatInput.tsx`, `MessageBubble.tsx`), los estilos también se aplican mayormente con clases de Tailwind directamente en el JSX. Si se requiere CSS más complejo o específico que no se logra fácilmente con utilidades, se pueden usar bloques `<style jsx>` o, preferiblemente, mantener la cohesión con Tailwind.
*   **`src/App.css`:** Contiene algunos estilos residuales o de ejemplo que podrían ser refactorizados o eliminados si no son específicos de la estructura general de la aplicación.

### Variables CSS

*   **Definición:** Las variables CSS para el sistema de diseño (colores, radio de borde, etc.) se definen principalmente en `src/index.css` bajo las pseudo-clases `:root` (para modo claro por defecto si no hay clase `dark`) y `.dark`.
*   **Uso en Tailwind:** `tailwind.config.ts` hace referencia a estas variables CSS (ej: `hsl(var(--primary))`, `var(--radius)`) para configurar la paleta de colores y otros aspectos del tema de Tailwind. Esto permite que Tailwind genere clases de utilidad que respetan las variables definidas.
*   **Aplicación:** Las variables se aplican en `src/index.css` para estilos base globales y también pueden ser usadas directamente en CSS personalizado si es necesario, aunque la preferencia es usar las utilidades de Tailwind.

Este sistema de diseño busca la eficiencia en el desarrollo, la consistencia visual y una alta personalización, especialmente para el modo oscuro preferido de uWuzi-Assist.
