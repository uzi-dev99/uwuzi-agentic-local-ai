# Proyecto de Chat Refactorizado (Mobile-First)

Este proyecto es una refactorización completa desde cero de una aplicación de chat, con un enfoque estricto en la filosofía "Mobile-First" y la simplicidad radical.

## Stack Tecnológico

* **Framework:** Next.js (App Router)
* **Lenguaje:** TypeScript
* **Estilos:** Tailwind CSS
* **Gestión de Estado:** React Hooks (useState, useContext, custom hooks)
* **Persistencia:** LocalStorage

## Cómo Iniciar el Proyecto

1.  Clonar el repositorio.
2.  Instalar las dependencias: `npm install`
3.  Iniciar el servidor de desarrollo: `npm run dev`
4.  Abrir [http://localhost:3000](http://localhost:3000) en el navegador.

## Known Issues (Incidencias Conocidas)

* **Advertencia de `params` en Next.js:** Al navegar a la página de chat, Next.js muestra una advertencia en la consola indicando que en una futura versión, el objeto `params` deberá ser desenvuelto con `React.use()`. Actualmente, el acceso directo está soportado y la aplicación es 100% funcional. Se ha tomado la decisión de no implementar este cambio por ahora para mantener la estabilidad y se revisará cuando la nueva versión de Next.js lo requiera.
