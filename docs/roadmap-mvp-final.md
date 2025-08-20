# 🚀 Roadmap MVP Final - Chat Agéntico con N8N

## 📋 Visión General

**Objetivo:** Implementar un chat limitado en Android que envíe POST al backend, el cual intercepta y enruta el mensaje para que llegue a N8N, donde Gemma 12B procesa la solicitud y envía la respuesta vía webhook de vuelta al Android con notificaciones al usuario.

**Arquitectura Final:**
```
Android App → Backend Proxy → Enrutador Archivos → Generador Contexto → N8N Webhook → Gemma 12B → Webhook Response → Notificación Push → Android
```

---

## 🎯 FASE 1: Habilitación del Modo Agente

### Objetivo
Habilitar el modo agente en el frontend y conectar con el backend existente.

### Tareas Específicas
1. **Remover bloqueo en ChatPage.tsx**
   - Eliminar mensaje "Agent Mode not available"
   - Habilitar llamada a `invokeAgent` cuando `chat.mode === 'agent'`
   - Mantener conversión de `FileData` a `File`

2. **Validar integración backend**
   - Verificar que `agent_service.py` responda correctamente
   - Confirmar que `n8n_service.py` esté configurado
   - Probar endpoint `/api/v1/agent/invoke` con datos reales

### Criterios de Aceptación
- ✅ Modo agente seleccionable en UI
- ✅ Llamadas exitosas al backend sin errores
- ✅ Respuesta simulada visible en chat

---

## 🔄 FASE 2: Enrutador de Archivos

### Objetivo
Implementar clasificación y procesamiento inteligente de archivos según su tipo.

### Tareas Específicas
1. **Crear `file_router_service.py`**
   - Función `classify_file_type(file: UploadFile) -> str`
   - Función `process_image_file(file: UploadFile) -> str` (base64)
   - Función `process_audio_file(file: UploadFile) -> str` (transcripción)
   - Función `process_pdf_file(file: UploadFile) -> str` (extracción texto)
   - Función `process_text_file(file: UploadFile) -> str` (lectura directa)

2. **Integrar en agent_service.py**
   - Llamar al enrutador para cada archivo recibido
   - Construir diccionario de archivos procesados
   - Pasar resultados al generador de contexto

### Criterios de Aceptación
- ✅ Imágenes convertidas a base64
- ✅ Audio transcrito vía Whisper
- ✅ PDFs con texto extraído
- ✅ Archivos de texto leídos correctamente
- ✅ Manejo de errores por tipo de archivo

---

## 🧠 FASE 3: Generador de Contexto

### Objetivo
Crear contexto optimizado para Gemma 12B con ventana deslizante y resumen inteligente.

### Tareas Específicas
1. **Crear `context_generator_service.py`**
   - Función `calculate_token_count(text: str) -> int`
   - Función `apply_sliding_window(messages: List, max_tokens: int) -> List`
   - Función `summarize_old_context(messages: List) -> str`
   - Función `build_final_context(messages: List, files_data: Dict) -> str`

2. **Configurar límites de tokens**
   - Definir límite máximo para Gemma 12B (ej. 8000 tokens)
   - Implementar estrategia de resumen cuando se exceda
   - Preservar siempre los últimos N mensajes

### Criterios de Aceptación
- ✅ Contexto optimizado dentro de límites de tokens
- ✅ Resumen automático de historial antiguo
- ✅ Metadatos de archivos incluidos apropiadamente
- ✅ Preservación de mensajes recientes

---

## 🌐 FASE 4: Integración Completa con N8N

### Objetivo
Configurar workflow completo en N8N con Gemma 12B y webhook de respuesta.

### Tareas Específicas
1. **Configurar Webhook de Entrada en N8N**
   - Crear nodo Webhook que reciba POST
   - Configurar captura de `context` y `metadata`
   - Validar estructura de datos recibidos

2. **Implementar Workflow con Gemma 12B**
   - Conectar webhook a nodo HTTP Request hacia Ollama
   - Configurar prompt template con contexto
   - Manejar respuesta de Gemma 12B

3. **Configurar Webhook de Respuesta**
   - Crear nodo HTTP Request hacia backend
   - Enviar respuesta a endpoint `/api/v1/webhook/response`
   - Incluir ID de chat y contenido de respuesta

4. **Actualizar backend para recibir webhook**
   - Crear endpoint `/api/v1/webhook/response`
   - Validar autenticación con API_KEY_SECRET
   - Procesar respuesta y preparar notificación

### Criterios de Aceptación
- ✅ Webhook N8N recibe contexto correctamente
- ✅ Gemma 12B procesa y responde
- ✅ Webhook response llega al backend
- ✅ Flujo completo sin errores

---

## 📱 FASE 5: Sistema de Notificaciones

### Objetivo
Implementar notificaciones push en Android y gestor de notificaciones en frontend.

### Tareas Específicas
1. **Backend - Gestor de Notificaciones**
   - Crear `notification_service.py`
   - Función `send_push_notification(chat_id: str, content: str)`
   - Integrar con webhook response handler

2. **Frontend - Gestor de Notificaciones**
   - Crear hook `useNotifications.ts`
   - Integrar en `ChatContext.tsx`
   - Mostrar notificaciones incluso fuera del chat activo

3. **Android - Configuración Push**
   - Configurar Capacitor Push Notifications
   - Manejar notificaciones en background
   - Abrir chat específico al tocar notificación

### Criterios de Aceptación
- ✅ Notificaciones push funcionando en Android
- ✅ Usuario recibe notificación cuando respuesta está lista
- ✅ Notificaciones visibles incluso con app minimizada
- ✅ Navegación correcta al chat desde notificación

---

## 🎯 FASE 6: Limitador de Tokens en Frontend

### Objetivo
Implementar contador de tokens y limitador en el frontend según Estándar 1.

### Tareas Específicas
1. **Crear hook `useTokenCounter.ts`**
   - Función `estimateTokenCount(text: string) -> number`
   - Función `calculateHistoryTokens(messages: Message[]) -> number`
   - Estado de tokens actuales y límite

2. **Integrar en MessageInput.tsx**
   - Mostrar contador de tokens en tiempo real
   - Advertencia cuando se acerque al límite
   - Bloquear envío si excede límite máximo

3. **Feedback visual en UI**
   - Indicador de tokens en MessageInput
   - Colores: verde (OK), amarillo (advertencia), rojo (límite)
   - Tooltip explicativo para el usuario

### Criterios de Aceptación
- ✅ Contador de tokens visible y preciso
- ✅ Advertencias apropiadas al usuario
- ✅ Prevención de envío cuando excede límite
- ✅ UX clara y no intrusiva

---

## 🔧 FASE 7: Optimización y Pulido

### Objetivo
Optimizar rendimiento, manejo de errores y UX móvil final.

### Tareas Específicas
1. **Optimización de Rendimiento**
   - Implementar timeouts apropiados
   - Optimizar tamaño de archivos enviados
   - Cachear respuestas cuando sea apropiado

2. **Manejo de Errores Robusto**
   - Mensajes de error claros para el usuario
   - Retry automático en fallos de red
   - Fallback a modo chat si agente falla

3. **UX Móvil Final**
   - Estados de carga con indicadores apropiados
   - Feedback haptic en acciones importantes
   - Optimización de gestos y navegación

### Criterios de Aceptación
- ✅ Tiempos de respuesta <10s para archivos <5MB
- ✅ Manejo elegante de errores de red
- ✅ UX móvil fluida y responsiva
- ✅ Feedback claro en todos los estados

---

## 🧪 FASE 8: Pruebas E2E Completas

### Objetivo
Validar flujo completo Android→Backend→N8N→Gemma→Webhook→Notificación en dispositivo físico.

### Tareas Específicas
1. **Pruebas por Tipo de Contenido**
   - Mensaje de texto simple
   - Imagen (JPG/PNG) con descripción
   - Audio MP3 con transcripción
   - PDF con extracción de texto
   - Archivo arbitrario con metadatos

2. **Pruebas de Flujo Completo**
   - Envío desde Android
   - Procesamiento en backend
   - Llegada a N8N y procesamiento
   - Respuesta de Gemma 12B
   - Webhook response al backend
   - Notificación push al Android

3. **Pruebas de Estrés**
   - Múltiples archivos simultáneos
   - Archivos de gran tamaño
   - Múltiples usuarios concurrentes
   - Fallos de red y recuperación

### Criterios de Aceptación
- ✅ 100% de tipos de archivo soportados
- ✅ Flujo completo sin errores
- ✅ Notificaciones llegando correctamente
- ✅ Rendimiento aceptable en dispositivo físico

---

## 📊 Métricas de Éxito MVP Final

### Funcionalidad
- ✅ Chat limitado funcional en Android
- ✅ POST al backend con enrutamiento inteligente
- ✅ Procesamiento de archivos (img/audio/PDF)
- ✅ Contexto optimizado enviado a N8N
- ✅ Gemma 12B respondiendo desde N8N
- ✅ Webhook response llegando al Android
- ✅ Notificaciones push al usuario

### Rendimiento
- ✅ Tiempo de respuesta <10s para archivos <5MB
- ✅ Uso eficiente de tokens (ventana deslizante)
- ✅ UX fluida sin bloqueos

### Confiabilidad
- ✅ 0 errores en flujo completo
- ✅ Manejo robusto de fallos de red
- ✅ Recuperación automática de errores

---

## 🎯 Próximos Pasos Post-MVP

1. **Expansión Agéntica**
   - Múltiples agentes especializados
   - Workflows complejos en N8N
   - Integración con bases de datos

2. **Funcionalidades Avanzadas**
   - RAG (Retrieval-Augmented Generation)
   - Memoria persistente de conversaciones
   - Análisis de sentimientos

3. **Escalabilidad**
   - Múltiples modelos LLM
   - Balanceador de carga
   - Métricas y monitoreo

Este roadmap asegura una implementación sistemática y escalable del MVP final, cumpliendo con todos los estándares del Manifiesto del Integrador.