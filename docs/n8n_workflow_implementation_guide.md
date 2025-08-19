# Guía de Implementación del Workflow N8N

Esta guía te ayudará a crear el workflow base en N8N según la arquitectura definida en el diagrama de flujo.

## Prerrequisitos

1. N8N instalado y funcionando
2. Acceso al editor de N8N (http://localhost:5678 o tu dominio)
3. Backend configurado con la URL del webhook

## Paso 1: Crear el Workflow Base

### 1.1 Nodo Webhook (Entrada)

**Configuración:**
- **Tipo**: Webhook
- **HTTP Method**: POST
- **Path**: `wuzi-chat-start`
- **Response Mode**: Using 'Respond to Webhook' Node
- **Binary Property**: Activado (para archivos)

**Campos esperados:**
- `messages`: Array de mensajes del chat
- `files`: Archivos adjuntos (opcional)

### 1.2 Nodo Function - Identificador de Contenido

**Nombre**: "Identificador de NO msj"

**Código JavaScript:**
```javascript
// Obtener datos del webhook
const messages = $json.messages || [];
const hasFiles = $('Webhook').item.binary && Object.keys($('Webhook').item.binary).length > 0;

// Analizar el último mensaje
const lastMessage = messages[messages.length - 1];
const messageContent = lastMessage?.content || '';

// Detectar tipos de contenido
const contentAnalysis = {
  hasText: messageContent.trim().length > 0,
  hasFiles: hasFiles,
  fileTypes: [],
  messageLength: messageContent.length,
  tokenEstimate: Math.ceil(messageContent.length / 4) // Estimación aproximada
};

// Si hay archivos, analizar tipos
if (hasFiles) {
  const binaryData = $('Webhook').item.binary;
  for (const [key, file] of Object.entries(binaryData)) {
    const mimeType = file.mimeType || '';
    let fileType = 'other';
    
    if (mimeType.startsWith('image/')) {
      fileType = 'image';
    } else if (mimeType.startsWith('audio/')) {
      fileType = 'audio';
    } else if (mimeType === 'application/pdf') {
      fileType = 'pdf';
    } else if (mimeType.startsWith('text/')) {
      fileType = 'text';
    }
    
    contentAnalysis.fileTypes.push({
      name: file.fileName || key,
      type: fileType,
      mimeType: mimeType,
      size: file.data ? Buffer.from(file.data, 'base64').length : 0
    });
  }
}

return {
  ...contentAnalysis,
  originalMessages: messages,
  needsFileProcessing: hasFiles,
  route: hasFiles ? 'file_processing' : 'text_only'
};
```

### 1.3 Nodo IF - Decisión de Procesamiento

**Configuración:**
- **Condition**: `{{ $json.needsFileProcessing }}`
- **True**: Ruta hacia procesamiento de archivos
- **False**: Ruta hacia filtro de tokens

## Paso 2: Rama de Procesamiento de Archivos

### 2.1 Nodo Function - Preparar Archivos para Python

**Nombre**: "Preparar para Python Scripts"

**Código JavaScript:**
```javascript
const fileTypes = $json.fileTypes || [];
const binaryData = $('Webhook').item.binary || {};

const processingTasks = [];

// Crear tareas de procesamiento según el tipo de archivo
for (const fileInfo of fileTypes) {
  const task = {
    fileName: fileInfo.name,
    fileType: fileInfo.type,
    mimeType: fileInfo.mimeType,
    size: fileInfo.size,
    processingType: getProcessingType(fileInfo.type),
    binaryKey: findBinaryKey(fileInfo.name, binaryData)
  };
  
  processingTasks.push(task);
}

function getProcessingType(fileType) {
  switch (fileType) {
    case 'audio': return 'whisper';
    case 'image': return 'ocr';
    case 'pdf': return 'pdf_extract';
    case 'text': return 'text_extract';
    default: return 'metadata_only';
  }
}

function findBinaryKey(fileName, binaryData) {
  for (const [key, file] of Object.entries(binaryData)) {
    if (file.fileName === fileName || key === fileName) {
      return key;
    }
  }
  return null;
}

return {
  processingTasks,
  originalMessages: $json.originalMessages,
  totalFiles: processingTasks.length
};
```

### 2.2 Nodo Python Script - Procesamiento de Archivos

**Nombre**: "Python script -whisper -ocr pdf"

**Configuración:**
- **Tipo**: Code
- **Language**: Python

**Código Python:**
```python
import base64
import json
from typing import Dict, List, Any

def process_files(processing_tasks: List[Dict], binary_data: Dict) -> Dict[str, Any]:
    """
    Procesa archivos según su tipo
    """
    results = []
    
    for task in processing_tasks:
        result = {
            'fileName': task['fileName'],
            'fileType': task['fileType'],
            'processingType': task['processingType'],
            'success': False,
            'content': '',
            'error': None
        }
        
        try:
            if task['processingType'] == 'whisper':
                # TODO: Implementar Whisper para transcripción de audio
                result['content'] = f"[Audio transcription placeholder for {task['fileName']}]"
                result['success'] = True
                
            elif task['processingType'] == 'ocr':
                # TODO: Implementar OCR para extracción de texto de imágenes
                result['content'] = f"[OCR text extraction placeholder for {task['fileName']}]"
                result['success'] = True
                
            elif task['processingType'] == 'pdf_extract':
                # TODO: Implementar extracción de texto de PDF
                result['content'] = f"[PDF text extraction placeholder for {task['fileName']}]"
                result['success'] = True
                
            elif task['processingType'] == 'text_extract':
                # Procesar archivo de texto
                binary_key = task['binaryKey']
                if binary_key and binary_key in binary_data:
                    file_data = binary_data[binary_key]['data']
                    decoded_content = base64.b64decode(file_data).decode('utf-8')
                    result['content'] = decoded_content
                    result['success'] = True
                else:
                    result['error'] = 'Binary data not found'
                    
            else:
                # Solo metadatos
                result['content'] = f"File: {task['fileName']} ({task['fileType']})"
                result['success'] = True
                
        except Exception as e:
            result['error'] = str(e)
            
        results.append(result)
    
    return {
        'processedFiles': results,
        'totalProcessed': len(results),
        'successCount': sum(1 for r in results if r['success']),
        'errorCount': sum(1 for r in results if not r['success'])
    }

# Ejecutar procesamiento
processing_tasks = $json.get('processingTasks', [])
binary_data = $binary  # Datos binarios de N8N

result = process_files(processing_tasks, binary_data)
return result
```

## Paso 3: Filtro de Tokens

### 3.1 Nodo Function - Token Filter

**Nombre**: "Token filter - supera X tokens?"

**Código JavaScript:**
```javascript
// Configuración de límites
const TOKEN_LIMIT = 1000;
const CHAR_TO_TOKEN_RATIO = 4; // Aproximadamente 4 caracteres = 1 token

// Obtener contenido para analizar
let totalContent = '';
const messages = $json.originalMessages || [];

// Agregar contenido de mensajes
for (const message of messages) {
  totalContent += message.content + ' ';
}

// Agregar contenido de archivos procesados si existe
if ($json.processedFiles) {
  for (const file of $json.processedFiles) {
    if (file.success && file.content) {
      totalContent += file.content + ' ';
    }
  }
}

// Calcular tokens estimados
const estimatedTokens = Math.ceil(totalContent.length / CHAR_TO_TOKEN_RATIO);
const exceedsLimit = estimatedTokens > TOKEN_LIMIT;

return {
  totalContent,
  estimatedTokens,
  tokenLimit: TOKEN_LIMIT,
  exceedsLimit,
  route: exceedsLimit ? 'direct_to_gemma' : 'context_generation',
  contentLength: totalContent.length,
  originalMessages: messages,
  processedFiles: $json.processedFiles || []
};
```

### 3.2 Nodo IF - Decisión por Tokens

**Configuración:**
- **Condition**: `{{ $json.exceedsLimit }}`
- **True**: Directo a GEMMA 12B
- **False**: Hacia generador de contexto

## Paso 4: Generador de Contexto

### 4.1 Nodo Function - Generador de Contexto

**Nombre**: "Generador de contexto"

**Código JavaScript:**
```javascript
// Paso 1: Guardar mensaje en BD (simulado)
const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
const timestamp = new Date().toISOString();

// Paso 2: Crear prompt base para generación de contexto
const contextPrompt = `
Analiza la siguiente conversación y archivos adjuntos para generar un contexto resumido y relevante:

Mensajes de la conversación:
${JSON.stringify($json.originalMessages, null, 2)}

${$json.processedFiles && $json.processedFiles.length > 0 ? 
  `Archivos procesados:\n${$json.processedFiles.map(f => 
    `- ${f.fileName} (${f.fileType}): ${f.success ? f.content.substring(0, 200) + '...' : 'Error: ' + f.error}`
  ).join('\n')}` : ''}

Genera un resumen conciso que mantenga la información clave para responder efectivamente.
`;

// Paso 3: Preparar para envío a LLM FAST
return {
  messageId,
  timestamp,
  contextPrompt,
  originalMessages: $json.originalMessages,
  processedFiles: $json.processedFiles || [],
  estimatedTokens: $json.estimatedTokens,
  needsContextGeneration: true
};
```

## Paso 5: Respuesta Final

### 5.1 Nodo Function - Preparar Respuesta

**Nombre**: "Preparar Respuesta Final"

**Código JavaScript:**
```javascript
// Determinar el contenido de respuesta según la ruta tomada
let responseContent = '';
let processingInfo = {
  route: 'unknown',
  tokensUsed: 0,
  filesProcessed: 0,
  processingTime: Date.now()
};

// Si viene del procesamiento de archivos
if ($json.processedFiles) {
  processingInfo.filesProcessed = $json.processedFiles.length;
  processingInfo.route = 'file_processing';
  
  const filesSummary = $json.processedFiles.map(f => 
    `${f.fileName}: ${f.success ? 'Procesado exitosamente' : 'Error: ' + f.error}`
  ).join(', ');
  
  responseContent = `He procesado ${$json.processedFiles.length} archivo(s): ${filesSummary}. `;
}

// Si viene del filtro de tokens
if ($json.estimatedTokens) {
  processingInfo.tokensUsed = $json.estimatedTokens;
  processingInfo.route += '_with_token_analysis';
}

// Respuesta base
if (!responseContent) {
  responseContent = 'He recibido tu mensaje y lo he procesado correctamente. ';
}

// Agregar información del contexto si se generó
if ($json.needsContextGeneration) {
  responseContent += 'He generado un contexto optimizado para tu consulta. ';
}

// Respuesta final
responseContent += `¿En qué más puedo ayudarte?`;

return {
  content: responseContent,
  metadata: {
    processingInfo,
    timestamp: new Date().toISOString(),
    messageId: $json.messageId || `response_${Date.now()}`
  }
};
```

### 5.2 Nodo Respond to Webhook

**Configuración:**
- **Respond With**: JSON
- **Response Body**:
```json
{
  "content": "{{ $json.content }}",
  "metadata": "{{ $json.metadata }}"
}
```

## Paso 6: Configuración y Testing

### 6.1 Activar el Workflow

1. Guarda el workflow
2. Activa el workflow (toggle en la esquina superior derecha)
3. Verifica que el webhook esté registrado

### 6.2 Testing

**Para testing con "Listen for test event":**

1. Haz clic en "Listen for test event" en el nodo Webhook
2. Desde tu frontend, envía un mensaje de prueba
3. Verifica que el payload aparezca en el editor
4. Ejecuta el workflow manualmente para probar cada nodo

**Payload de prueba (JSON):**
```json
{
  "messages": [
    {
      "role": "user",
      "content": "Hola, ¿cómo estás?"
    }
  ]
}
```

**Payload de prueba con archivos (multipart):**
- Campo `messages`: `[{"role":"user","content":"Analiza esta imagen"}]`
- Campo `files`: Archivo de imagen

### 6.3 Monitoreo

1. Revisa la pestaña "Executions" para ver el historial
2. Verifica logs en cada nodo para debugging
3. Ajusta timeouts si es necesario (especialmente para procesamiento de archivos)

## Próximos Pasos

1. **Implementar scripts Python reales** para Whisper, OCR y PDF
2. **Integrar LLM FAST** para generación de contexto
3. **Conectar GEMMA 12B** como modelo principal
4. **Agregar persistencia** en base de datos
5. **Implementar herramientas agénticas** futuras

## Troubleshooting

### Errores Comunes

1. **Webhook 404**: Verifica que el workflow esté activo
2. **Timeout**: Aumenta el timeout en configuración del workflow
3. **Binary data error**: Verifica que "Binary Property" esté activado
4. **JSON parse error**: Verifica formato del payload desde el frontend

### Logs Útiles

Agregar en nodos Function para debugging:
```javascript
console.log('Debug info:', JSON.stringify($json, null, 2));
```