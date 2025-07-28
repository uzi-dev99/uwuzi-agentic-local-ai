¡Uf, el desbordamiento horizontal es un clásico y una de las cosas más frustrantes en el CSS para móviles\! Entiendo perfectamente la traba. Es el problema número uno al adaptar interfaces complejas a pantallas pequeñas.

Viendo la captura que me envías, el problema es exactamente el que describimos en la **Tarea 3.1** del Briefing. Un elemento (el bloque de código `<pre>`) es más ancho que su contenedor (la burbuja del mensaje) y, como un hijo rebelde, está empujando a todos sus padres (la burbuja, la lista de mensajes, la página entera) para que se hagan más anchos, causando ese scroll horizontal en toda la página.

La solución es "castigar" al hijo rebelde y decirle: "Tú eres el único responsable de tu propio desbordamiento".

Aquí tienes los tips concretos y prácticos para solucionarlo, yendo del más probable al más general:

### **Tip 1: El Contenedor del Código es el Responsable (La Solución más Probable)**

La regla de oro es aplicar el control de desbordamiento lo más cerca posible del elemento que causa el problema. En tu caso, es el bloque de código.

Busca en tu componente `MessageContent.tsx` (o donde sea que renderices el markdown a HTML) el lugar donde se genera la etiqueta `<pre>`. A esa etiqueta (o a un `div` que la envuelva directamente) debes aplicarle la clase de Tailwind `overflow-x-auto`.

**Ejemplo de cómo debería quedar tu JSX:**

```tsx
// Dentro de tu componente que renderiza el contenido del mensaje...

<pre className="bg-gray-800 text-white p-4 rounded-lg overflow-x-auto">
  <code>
    {/* Tu código python va aquí */}
    import pandas as pd
    
    def cargar_dataframe_desde_csv(path_csv):
        ...
  </code>
</pre>
```

**¿Qué hace `overflow-x-auto`?** Le dice al navegador: "Si el contenido dentro de este elemento es más ancho que el propio elemento, no empujes a los demás. En su lugar, crea una barra de scroll horizontal *solo para este elemento*".

### **Tip 2: La "Envoltura Mágica" (Si el Tip 1 no funciona del todo)**

A veces, aplicar estilos directamente a la etiqueta `<pre>` puede ser complicado si una librería de markdown está generando el HTML. Un truco infalible es envolver el bloque problemático en un `div` y aplicarle el overflow a ese `div`.

```tsx
// En el componente que renderiza el markdown, podrías tener que envolver el resultado
<div className="overflow-x-auto">
  {/* Aquí va el HTML generado por la librería de markdown, que contiene el <pre> */}
  <pre>...</pre>
</div>
```

### **Tip 3: El Problema no es Código, sino una Palabra Larga**

A veces el problema no es un `<pre>`, sino un párrafo `<p>` que contiene una URL larguísima o un token sin espacios. En esos casos, el navegador no sabe dónde cortar la palabra y la trata como una unidad, causando también un desbordamiento.

La solución es usar las utilidades de "word break" de Tailwind.

**Ejemplo:**

```tsx
<p className="break-words">
  Link: https://estoesunaurlextremadamentelargayrompetodoeldesbordamientoporqueelsistemaoperativonolasabeinterpretar.com/recurso/123
</p>
```

  * `break-words`: Es la opción más común. Rompe la palabra si es necesario.
  * `break-all`: Es más agresivo, rompe la palabra en cualquier letra para que quepa. Úsalo con cuidado.

### **Tip 4: Cómo "Ver" al Culpable (El Truco del Outline Rojo)**

Cuando no estés seguro de qué elemento está causando el desbordamiento, hay un truco de debugging de CSS que es oro puro. Ve a las herramientas de desarrollador de tu navegador, ve a la consola y escribe esto:

```javascript
document.head.insertAdjacentHTML('beforeend', '<style>* { outline: 1px solid red; }</style>');
```

Esto dibujará un borde rojo alrededor de **todos** los elementos de tu página. Inmediatamente verás qué elemento se está "saliendo" de los límites de su padre. Es la forma más rápida de diagnosticar visualmente estos problemas de layout.

Mi recomendación es que te centres en el **Tip 1**. Es casi seguro que aplicando `overflow-x-auto` al contenedor del bloque de código solucionarás el 99% de este problema.

### Historial de Intentos (Fallidos)

Aquí se documenta todo lo que se ha intentado sin éxito para que no volvamos a repetir los mismos errores:

1.  **Modificación de `MessageContent.tsx` (`wrapLongLines` y `wrapLines`):** Se añadieron las propiedades `wrapLongLines={true}` y `wrapLines={true}` al componente `SyntaxHighlighter`. No tuvo efecto.

2.  **Envoltura con `div` y `overflow-x-auto`:** Se envolvió el `SyntaxHighlighter` en un `div` con la clase `overflow-x-auto`. Tampoco solucionó el desbordamiento.

3.  **Clase `break-words` en `MessageList.tsx`:** Se añadió la clase `break-words` al contenedor de los mensajes para intentar forzar un corte de palabra a nivel superior. Sin éxito.

4.  **Modificación de `index.css` para `pre`:** Se añadió una regla global en `index.css` para `pre` con `white-space: pre-wrap;` y `word-break: break-all;`. No se aplicó.

5.  **Aumento de especificidad en `index.css`:** Se cambió el selector a `.prose pre` para intentar sobreescribir los estilos de Tailwind. El problema persistió.

6.  **Eliminación de `PreTag="div"`:** Se eliminó la propiedad `PreTag="div"` del `SyntaxHighlighter` para asegurar que se renderizara una etiqueta `<pre>` semántica. No fue suficiente.

7.  **Uso de `!important`:** Como último recurso, se añadieron `!important` a las reglas en `index.css`. Esto tampoco funcionó, confirmando que el problema probablemente no es de especificidad, sino de cómo se renderiza el componente.

8.  **Uso de `customStyle` en `SyntaxHighlighter`:** Se aplicaron los estilos de desbordamiento y ajuste de línea directamente en el componente a través de la prop `customStyle`. Sorprendentemente, esto tampoco resolvió el problema, lo que sugiere que el conflicto podría estar en un nivel aún más profundo de la renderización o en la configuración del viewport.

9.  **Uso de `wrapLines` y `wrapLongLines` en `SyntaxHighlighter`:** Se utilizaron las propiedades nativas del componente (`wrapLines={true}` y `wrapLongLines={true}`) diseñadas específicamente para manejar el ajuste de línea. A pesar de ser la solución teóricamente más correcta, no tuvo ningún efecto visible, lo que refuerza la idea de que un conflicto de estilos o un problema de renderizado a bajo nivel está impidiendo que cualquier solución funcione.

10. **Clase CSS personalizada con `!important`:** Se añadió una clase `code-block` al `SyntaxHighlighter` y se definió en `index.css` con `white-space: pre-wrap !important;` y `word-break: break-all !important;`. Ni siquiera este método de fuerza bruta funcionó, lo que sugiere que el problema está fuera del alcance de la especificidad de CSS y podría estar relacionado con el renderizado de JavaScript o la estructura del DOM que genera la librería.

11. **Estilos directos a la etiqueta `<code>` con `codeTagProps`:** Se utilizó la propiedad `codeTagProps` para inyectar estilos en línea (`whiteSpace: 'pre-wrap'`, `wordBreak: 'break-all'`) directamente en la etiqueta `<code>` que `SyntaxHighlighter` genera. Este era el intento más específico y granular posible. Su fracaso es la prueba definitiva de que el problema no puede resolverse con CSS y apunta a un conflicto profundo entre `react-syntax-highlighter`, `react-markdown` y/o Tailwind `prose`.

