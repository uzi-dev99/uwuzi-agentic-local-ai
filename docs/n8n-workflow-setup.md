# 🔄 Configuración del Workflow N8N para Wuzi

## 📋 Resumen

Este documento describe la configuración completa del workflow en N8N para integrar Gemma 12B con el sistema Wuzi. El workflow recibe contexto optimizado del backend, lo procesa con Gemma 12B y envía la respuesta de vuelta al backend.

## 🌐 Arquitectura del Workflow

```
Backend → N8N Webhook (Entrada) → Gemma 12B (Ollama) → N8N Webhook (Respuesta) → Backend
```

---

## 🎯 PASO 1: Configurar Webhook de Entrada

### Nodo: Webhook (Trigger)

**Configuración:**
- **HTTP Method:** POST
- **Path:** `wuzi-chat-start`
- **Authentication:** None (se valida en backend)
- **Response Mode:** Respond Immediately

**URLs:**
- **Testing:** `http://n8n:5678/webhook-test/wuzi-chat-start`
- **Production:** `http://n8n:5678/webhook/wuzi-chat-start`

### Datos Recibidos

#### Formato JSON (sin archivos):
```json
{
  "mode": "agent",
  "context": "[CONTEXTO ADICIONAL]\nEres un asistente AI multimodal...\n\n[USER]: Hola, ¿cómo estás?",
  "messages_count": 3,
  "files_count": 0,
  "estimated_tokens": 150,
  "within_limits": true,
  "timestamp": "2024-01-20T10:30:00Z",
  "original_messages": 5,
  "files_summary": "No hay archivos adjuntos."
}
```

#### Formato Multipart (con archivos):
```
POST /webhook/wuzi-chat-start
Content-Type: multipart/form-data

context: [CONTEXTO OPTIMIZADO]
messages_count: 3
files_count: 2
estimated_tokens: 450
files_summary: Imagen ejemplo.jpg (datos en base64 disponibles)
Audio grabacion.mp3 - Transcripción: Hola, necesito ayuda...
files: [archivo1]
files: [archivo2]
```

---

## 🧠 PASO 2: Procesar con Gemma 12B

### Nodo: HTTP Request (Ollama)

**Configuración:**
- **Method:** POST
- **URL:** `http://ollama:11434/api/generate`
- **Headers:**
  ```json
  {
    "Content-Type": "application/json"
  }
  ```

### Construcción del Payload

**Nodo: Function (Preparar Prompt)**
```javascript
// Obtener datos del webhook
const webhookData = $input.first().json;

// Construir prompt para Gemma 12B
const prompt = `${webhookData.context}

[INSTRUCCIONES]
Eres Wuzi, un asistente AI multimodal inteligente. Analiza el contexto completo y proporciona una respuesta útil, precisa y contextualmente apropiada. Si hay archivos adjuntos, considera su contenido en tu respuesta.

Respuesta:`;

// Payload para Ollama
const payload = {
  model: "gemma3:12b",
  prompt: prompt,
  stream: false,
  options: {
    temperature: 0.7,
    top_p: 0.9,
    max_tokens: 2000,
    stop: ["[USER]:", "[ASSISTANT]:"]
  }
};

// Metadata para tracking
const metadata = {
  original_messages: webhookData.original_messages || 0,
  processed_messages: webhookData.messages_count || 0,
  files_count: webhookData.files_count || 0,
  estimated_input_tokens: webhookData.estimated_tokens || 0,
  timestamp: new Date().toISOString()
};

return {
  json: {
    payload: payload,
    metadata: metadata,
    webhook_data: webhookData
  }
};
```

### Llamada a Ollama

**Body del HTTP Request:**
```json
{{ $json.payload }}
```

---

## 📤 PASO 3: Procesar Respuesta de Gemma

### Nodo: Function (Procesar Respuesta)

```javascript
// Obtener respuesta de Ollama
const ollamaResponse = $input.first().json;
const metadata = $input.first().json.metadata;
const webhookData = $input.first().json.webhook_data;

// Extraer contenido de la respuesta
let content = "";
if (ollamaResponse.response) {
  content = ollamaResponse.response.trim();
} else if (ollamaResponse.content) {
  content = ollamaResponse.content.trim();
} else {
  content = "Lo siento, no pude generar una respuesta. Por favor, intenta de nuevo.";
}

// Limpiar respuesta (remover prefijos innecesarios)
content = content.replace(/^(Respuesta:|Response:)/i, '').trim();

// Preparar respuesta para el backend
const responseData = {
  chat_id: webhookData.chat_id || null,
  content: content,
  status: "success",
  timestamp: new Date().toISOString(),
  metadata: {
    model: "gemma3:12b",
    input_tokens: metadata.estimated_input_tokens,
    output_tokens: Math.ceil(content.length / 4), // Estimación
    processing_time: Date.now() - new Date(metadata.timestamp).getTime(),
    files_processed: metadata.files_count,
    messages_processed: metadata.processed_messages
  }
};

return { json: responseData };
```

---

## 🔄 PASO 4: Enviar Respuesta al Backend

### Nodo: HTTP Request (Webhook Response)

**Configuración:**
- **Method:** POST
- **URL:** `http://backend:8000/api/v1/webhook/response`
- **Headers:**
  ```json
  {
    "Content-Type": "application/json",
    "X-API-Key": "{{ $env.API_KEY_SECRET }}"
  }
  ```

**Body:**
```json
{{ $json }}
```

---

## ⚠️ PASO 5: Manejo de Errores

### Nodo: Function (Error Handler)

```javascript
// Detectar tipo de error
const error = $input.first().error || {};
const errorMessage = error.message || "Error desconocido en el workflow";

// Preparar respuesta de error
const errorResponse = {
  chat_id: null,
  content: `Lo siento, ocurrió un error al procesar tu solicitud: ${errorMessage}. Por favor, intenta de nuevo o cambia a modo chat.`,
  status: "error",
  timestamp: new Date().toISOString(),
  metadata: {
    error_type: error.type || "unknown",
    error_details: errorMessage
  }
};

return { json: errorResponse };
```

### Conectar Error Handler
- Conectar desde nodos HTTP Request con "On Error"
- Enviar respuesta de error al backend usando el mismo webhook

---

## 🔧 Variables de Entorno N8N

```bash
# En el contenedor N8N
API_KEY_SECRET=PpKb86bkIfszCuNrMMK62yDfgT6hsYRB
OLLAMA_URL=http://ollama:11434
BACKEND_URL=http://backend:8000
```

---

## 📊 Flujo Completo del Workflow

1. **Webhook Trigger** → Recibe contexto del backend
2. **Function: Preparar Prompt** → Construye payload para Gemma
3. **HTTP Request: Ollama** → Llama a Gemma 12B
4. **Function: Procesar Respuesta** → Limpia y estructura respuesta
5. **HTTP Request: Backend** → Envía respuesta al webhook
6. **Error Handler** → Maneja errores y envía respuesta de error

---

## ✅ Criterios de Validación

### Pruebas Básicas:
1. **Mensaje simple:** Enviar texto sin archivos
2. **Mensaje con imagen:** Enviar imagen con descripción
3. **Mensaje con audio:** Enviar audio transcrito
4. **Mensaje con PDF:** Enviar PDF con texto extraído
5. **Error handling:** Simular error en Ollama

### Métricas de Éxito:
- ✅ Webhook recibe datos correctamente
- ✅ Gemma 12B responde en <10 segundos
- ✅ Respuesta llega al backend sin errores
- ✅ Manejo apropiado de errores
- ✅ Logs detallados para debugging

---

## 🚀 Activación del Workflow

1. **Testing:** Usar URL de test y presionar "Listen for test event"
2. **Production:** Activar workflow para registrar webhook en producción
3. **Monitoring:** Revisar logs en N8N y backend para validar funcionamiento

Este workflow completa la FASE 4 del roadmap MVP, estableciendo la comunicación bidireccional entre el backend Wuzi y Gemma 12B a través de N8N.