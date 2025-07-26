# Documentación de Gesto de Deslizar para Abrir Sidebar

## Descripción General

Se ha implementado una funcionalidad de gesto de deslizar hacia la derecha para abrir el sidebar en dispositivos móviles. Esta característica mejora la experiencia de usuario permitiendo un acceso más intuitivo al menú lateral.

## Componentes Implementados

### 1. Hook `useSwipeGesture`
**Archivo:** `src/hooks/useSwipeGesture.ts`

- **Propósito:** Detecta gestos de deslizar en pantallas táctiles
- **Características:**
  - Detecta deslizamientos horizontales (izquierda/derecha)
  - Configurable con umbral personalizable
  - Distingue entre movimientos horizontales y verticales
  - Previene activación accidental durante scroll vertical

**Parámetros:**
- `onSwipeRight`: Callback ejecutado al deslizar hacia la derecha
- `onSwipeLeft`: Callback ejecutado al deslizar hacia la izquierda
- `threshold`: Distancia mínima en píxeles para considerar un swipe (default: 50px)
- `preventDefaultTouchMove`: Prevenir comportamiento por defecto durante el movimiento

### 2. Componente `SwipeToOpenSidebar`
**Archivo:** `src/components/ui/SwipeToOpenSidebar.tsx`

- **Propósito:** Wrapper que integra el gesto de deslizar con el sistema de sidebar
- **Características:**
  - Solo activo en dispositivos móviles (cuando `isMobileLayout` es true)
  - Solo funciona cuando el sidebar está cerrado
  - Detecta si el toque comenzó desde el borde izquierdo de la pantalla
  - Abre el sidebar móvil al deslizar hacia la derecha desde el borde

**Parámetros:**
- `swipeThreshold`: Distancia mínima para activar el gesto (default: 80px)
- `edgeThreshold`: Distancia desde el borde izquierdo donde se puede iniciar el gesto (default: 50px)

## Integración en las Vistas

La funcionalidad se ha integrado en las siguientes vistas:

### HomeView
**Archivo:** `src/views/HomeView.tsx`
- Envuelve todo el contenido con `SwipeToOpenSidebar`
- Permite abrir el sidebar deslizando desde el borde izquierdo

### DashboardView
**Archivo:** `src/views/DashboardView.tsx`
- Misma implementación que HomeView
- Funcionalidad consistente en toda la aplicación

## Cómo Funciona

1. **Detección de Inicio:** El usuario toca la pantalla dentro de los primeros 50px desde el borde izquierdo
2. **Seguimiento del Movimiento:** Se rastrea el movimiento del dedo
3. **Validación del Gesto:** Se verifica que:
   - El movimiento sea principalmente horizontal
   - La distancia recorrida supere el umbral (80px)
   - El dispositivo esté en modo móvil
   - El sidebar esté cerrado
4. **Activación:** Si se cumplen todas las condiciones, se abre el sidebar móvil

## Consideraciones de UX

- **Zona de Activación:** Solo se activa desde el borde izquierdo para evitar conflictos con otros gestos
- **Feedback Visual:** El sidebar se abre con la animación existente del Sheet component
- **No Interferencia:** No interfiere con el scroll vertical ni otros gestos táctiles
- **Consistencia:** Funciona de manera consistente en todas las vistas que tienen sidebar

## Configuración

Los valores por defecto están optimizados para la mayoría de casos de uso:
- **Umbral de Swipe:** 80px (suficiente para ser intencional, no accidental)
- **Zona de Borde:** 50px (fácil de alcanzar sin interferir con contenido)

Estos valores pueden ajustarse pasando props al componente `SwipeToOpenSidebar` si es necesario.

## Compatibilidad

- **Dispositivos:** Solo activo en pantallas táctiles
- **Tamaños de Pantalla:** Solo en modo móvil (< 1024px)
- **Navegadores:** Compatible con todos los navegadores modernos que soporten eventos touch

## Notas Técnicas

- Utiliza eventos `touchstart`, `touchmove`, y `touchend` nativos
- Se integra con el sistema de sidebar existente de shadcn/ui
- No requiere librerías adicionales
- Rendimiento optimizado con `useCallback` y `useRef`