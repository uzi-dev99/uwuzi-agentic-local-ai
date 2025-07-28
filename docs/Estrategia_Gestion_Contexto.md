# Estrategia de Gestión de Contexto y Memoria para Wuzi Chat

## Resumen Ejecutivo

Este documento define la estrategia completa para manejar el contexto y la memoria en el modo chat de Wuzi, optimizando el rendimiento y la experiencia del usuario mientras se mantiene la coherencia conversacional.

## 1. Análisis del Problema

### 1.1 Limitaciones Actuales
- **Sin gestión de contexto**: Todos los mensajes se envían a Ollama sin límites
- **Riesgo de desbordamiento**: Conversaciones largas pueden exceder límites de tokens
- **Rendimiento degradado**: Más contexto = respuestas más lentas y mayor uso de memoria
- **Costos elevados**: Mayor procesamiento en cada solicitud

### 1.2 Límites Típicos de Modelos
- **Llama 3 (7B)**: ~8,192 tokens de contexto
- **Qwen 2.5 (7B)**: ~32,768 tokens de contexto
- **Gemma 3n (2B/4B)**: **32,000 tokens de contexto** (multimodal)
- **Estimación promedio**: 
  - 1 mensaje de texto = 50-200 tokens
  - 1 imagen = 256-512 tokens (con codificador MobileNet-V5)
  - 1 archivo de audio = 100-300 tokens (con reconocimiento nativo)
  - **Gemma 3n optimizado**: Parámetros efectivos reducidos con PLE caché

## 2. Estrategias de Gestión de Contexto

### 2.1 Ventana Deslizante (Sliding Window)
**Descripción**: Mantener solo los N mensajes más recientes en el contexto.

**Ventajas**:
- Implementación simple
- Rendimiento predecible
- Mantiene coherencia reciente

**Desventajas**:
- Pérdida de contexto histórico importante
- Puede romper referencias a información anterior

**Implementación**:
```python
def sliding_window_context(messages, window_size=15):
    if len(messages) <= window_size:
        return messages
    return messages[-window_size:]
```

### 2.2 Preservación de Contexto Crítico
**Descripción**: Mantener siempre ciertos mensajes importantes (primer mensaje, mensajes del sistema).

**Implementación**:
```python
def preserve_critical_context(messages, window_size=15):
    if len(messages) <= window_size:
        return messages
    
    # Preservar primer mensaje y mensajes del sistema
    critical_messages = [msg for msg in messages[:3] if msg['role'] == 'system' or messages.index(msg) == 0]
    recent_messages = messages[-(window_size - len(critical_messages)):]
    
    return critical_messages + recent_messages
```

### 2.3 Resumen Inteligente
**Descripción**: Generar resúmenes automáticos de conversaciones largas.

**Proceso**:
1. Detectar cuando el contexto excede el umbral
2. Generar resumen de mensajes antiguos
3. Reemplazar mensajes antiguos con el resumen
4. Mantener mensajes recientes intactos

**Implementación**:
```python
async def generate_conversation_summary(messages_to_summarize):
    summary_prompt = """
    Resume la siguiente conversación manteniendo:
    - Puntos clave discutidos
    - Decisiones tomadas
    - Información importante para el contexto
    - Tono conversacional
    
    Conversación:
    {conversation}
    
    Resumen:
    """
    
    # Enviar a Ollama para generar resumen
    # ...
```

### 2.4 Compresión de Mensajes
**Descripción**: Optimizar mensajes largos sin perder información esencial.

**Técnicas**:
- Eliminar texto redundante
- Comprimir código manteniendo funcionalidad
- Resumir explicaciones largas
- Mantener datos estructurados intactos

### 2.5 Gestión de Contexto Multimodal (Gemma 3n)
**Descripción**: Estrategias específicas para manejar contenido multimedia aprovechando el contexto extendido de 32,000 tokens de Gemma 3n.

**Consideraciones Especiales**:
- **Contexto Extendido**: 32,000 tokens permiten mantener más contenido multimedia
- **Optimización PLE**: Caché de parámetros de incorporación por capa para eficiencia
- **MatFormer**: Arquitectura anidada para procesamiento selectivo
- **Carga Condicional**: Activación/desactivación de parámetros audio/visual según necesidad
- **MobileNet-V5**: Codificador optimizado para procesamiento de imágenes
- **Reconocimiento Nativo**: Soporte integrado para audio y transcripción
- **Compresión Inteligente**: Reducir resolución de imágenes en contexto histórico
- **Referenciado**: Mantener referencias a multimedia sin incluir el contenido completo
- **Caché Multimodal**: Almacenar procesamiento previo de imágenes/audio

**Implementación**:
```python
def manage_multimodal_context_gemma3n(messages, max_tokens=30000):
    """
    Gestiona contexto aprovechando el contexto extendido de Gemma 3n (32,000 tokens)
    Incluye optimizaciones PLE, MatFormer y carga condicional
    """
    current_tokens = 0
    processed_messages = []
    multimedia_cache = {}
    
    # Configurar parámetros según disponibilidad de recursos
    use_ple_cache = os.getenv('GEMMA_ENABLE_PLE_CACHE', 'true').lower() == 'true'
    conditional_loading = os.getenv('GEMMA_CONDITIONAL_LOADING', 'true').lower() == 'true'
    
    # Procesar mensajes desde el más reciente
    for msg in reversed(messages):
        msg_tokens = estimate_message_tokens_gemma3n(msg)
        
        if current_tokens + msg_tokens > max_tokens:
            # Con contexto extendido, intentar compresión antes de descartar
            if has_multimedia(msg):
                if conditional_loading:
                    # Usar carga condicional para optimizar memoria
                    compressed_msg = compress_multimedia_with_conditional_loading(msg)
                    if current_tokens + estimate_message_tokens_gemma3n(compressed_msg) <= max_tokens:
                        processed_messages.insert(0, compressed_msg)
                        current_tokens += estimate_message_tokens_gemma3n(compressed_msg)
                        continue
                
                # Si no cabe, crear referencia con PLE caché
                if use_ple_cache:
                    ref_msg = create_multimedia_reference_with_ple(msg, multimedia_cache)
                else:
                    ref_msg = create_multimedia_reference(msg)
                
                processed_messages.insert(0, ref_msg)
                current_tokens += estimate_message_tokens_gemma3n(ref_msg)
            break
        else:
            processed_messages.insert(0, msg)
            current_tokens += msg_tokens
    
    return processed_messages, multimedia_cache

def estimate_message_tokens_gemma3n(message):
    """
    Estimación de tokens específica para Gemma 3n con optimizaciones
    """
    base_tokens = len(message.get('content', '').split()) * 1.3
    
    # Ajustes para contenido multimedia con MobileNet-V5 y reconocimiento nativo
    if message.get('images'):
        # MobileNet-V5 es más eficiente en tokens
        base_tokens += len(message['images']) * 200  # Reducido de 256-512
    
    if message.get('audio'):
        # Reconocimiento nativo es más eficiente
        base_tokens += len(message['audio']) * 80   # Reducido de 100-300
    
    return int(base_tokens)
```

## 3. Configuración Recomendada

### 3.1 Parámetros de Contexto
```python
# Configuración en backend/.env
MAX_CONTEXT_MESSAGES=20          # Máximo de mensajes en contexto
CONTEXT_WINDOW_SIZE=15           # Tamaño de ventana deslizante
SUMMARY_THRESHOLD=25             # Umbral para activar resumen
CRITICAL_MESSAGES_COUNT=3        # Mensajes críticos a preservar
MAX_MESSAGE_LENGTH=2000          # Longitud máxima por mensaje
CONTEXT_COMPRESSION_RATIO=0.8    # Ratio de compresión objetivo

# Configuración Multimodal (Gemma 3n)
MAX_CONTEXT_TOKENS=30000         # Límite de tokens para Gemma 3n (32,000 disponibles)
MAX_IMAGES_IN_CONTEXT=15         # Máximo de imágenes en contexto (aumentado por contexto extendido)
MAX_AUDIO_FILES_IN_CONTEXT=8     # Máximo de archivos de audio en contexto
IMAGE_COMPRESSION_QUALITY=0.8    # Calidad de compresión para imágenes (MobileNet-V5 optimizado)
MAX_IMAGE_SIZE_MB=8              # Tamaño máximo de imagen (MB)
MAX_AUDIO_DURATION_SEC=120       # Duración máxima de audio (segundos)
MULTIMODAL_CACHE_SIZE_MB=200     # Tamaño de caché para contenido multimedia

# Configuraciones específicas de Gemma 3n
GEMMA_ENABLE_PLE_CACHE=true      # Habilitar caché de parámetros PLE
GEMMA_CONDITIONAL_LOADING=true   # Habilitar carga condicional de parámetros
GEMMA_MATFORMER_MODE=true        # Usar arquitectura MatFormer
GEMMA_MODEL_SIZE=2B              # Tamaño del modelo (2B o 4B)
GEMMA_EFFECTIVE_PARAMS_RATIO=0.4 # Ratio de parámetros efectivos (E2B: ~1.9B/5B)
```

### 3.2 Estrategia Híbrida Recomendada
1. **Fase 1**: Ventana deslizante simple (implementación inmediata)
2. **Fase 2**: Preservación de contexto crítico
3. **Fase 3**: Resumen inteligente automático
4. **Fase 4**: Compresión avanzada de mensajes

## 4. Implementación Técnica

### 4.1 Backend - Función Principal
```python
# En chat_service.py
async def manage_chat_context(messages: list, config: dict) -> list:
    """
    Gestiona el contexto del chat aplicando estrategias de optimización
    """
    # 1. Verificar si necesita gestión
    if len(messages) <= config['MAX_CONTEXT_MESSAGES']:
        return messages
    
    # 2. Aplicar estrategia según configuración
    if config.get('USE_SUMMARY', False) and len(messages) > config['SUMMARY_THRESHOLD']:
        return await apply_summary_strategy(messages, config)
    else:
        return apply_sliding_window(messages, config)

async def apply_summary_strategy(messages: list, config: dict) -> list:
    """
    Aplica estrategia de resumen para conversaciones largas
    """
    window_size = config['CONTEXT_WINDOW_SIZE']
    critical_count = config['CRITICAL_MESSAGES_COUNT']
    
    # Preservar mensajes críticos
    critical_messages = messages[:critical_count]
    recent_messages = messages[-window_size:]
    middle_messages = messages[critical_count:-window_size]
    
    if middle_messages:
        # Generar resumen de mensajes del medio
        summary = await generate_conversation_summary(middle_messages)
        summary_message = {
            'role': 'system',
            'content': f"[Resumen de conversación anterior]: {summary}"
        }
        return critical_messages + [summary_message] + recent_messages
    
    return critical_messages + recent_messages

def apply_sliding_window(messages: list, config: dict) -> list:
    """
    Aplica ventana deslizante simple
    """
    window_size = config['CONTEXT_WINDOW_SIZE']
    return messages[-window_size:]
```

### 4.2 Frontend - Indicadores de Contexto
```typescript
// En ChatHeader.tsx - Añadir indicador de contexto
interface ContextIndicatorProps {
  totalMessages: number;
  contextMessages: number;
  isContextLimited: boolean;
}

const ContextIndicator: React.FC<ContextIndicatorProps> = ({ 
  totalMessages, 
  contextMessages, 
  isContextLimited 
}) => {
  if (!isContextLimited) return null;
  
  return (
    <div className="text-xs text-muted flex items-center gap-1">
      <InfoIcon className="w-3 h-3" />
      <span>Contexto: {contextMessages}/{totalMessages} mensajes</span>
    </div>
  );
};
```

## 5. Métricas y Monitoreo

### 5.1 Métricas Clave
- **Longitud promedio de contexto**: Tokens enviados por solicitud
- **Tiempo de respuesta**: Latencia vs tamaño de contexto
- **Tasa de resúmenes**: Frecuencia de activación de resúmenes
- **Satisfacción del usuario**: Coherencia percibida en respuestas

### 5.2 Logging
```python
import logging

logger = logging.getLogger(__name__)

def log_context_metrics(original_length: int, final_length: int, strategy: str):
    logger.info(f"Context management: {original_length} -> {final_length} messages using {strategy}")
```

## 6. Casos de Uso y Ejemplos

### 6.1 Conversación Corta (< 15 mensajes)
- **Estrategia**: Sin gestión, enviar todos los mensajes
- **Resultado**: Contexto completo preservado

### 6.2 Conversación Media (15-25 mensajes)
- **Estrategia**: Ventana deslizante
- **Resultado**: Últimos 15 mensajes + primer mensaje

### 6.3 Conversación Larga (> 25 mensajes)
- **Estrategia**: Resumen inteligente
- **Resultado**: Primeros 3 mensajes + resumen + últimos 12 mensajes

## 7. Roadmap de Implementación

### Fase 1: Fundación (Semana 1)
- [ ] Implementar ventana deslizante básica
- [ ] Añadir configuración de parámetros
- [ ] Crear logging básico

### Fase 2: Optimización (Semana 2)
- [ ] Preservación de contexto crítico
- [ ] Indicadores en frontend
- [ ] Métricas de rendimiento

### Fase 3: Inteligencia (Semana 3)
- [ ] Resumen automático
- [ ] Compresión de mensajes
- [ ] Optimización avanzada

### Fase 4: Refinamiento (Semana 4)
- [ ] Ajuste de parámetros basado en uso
- [ ] Optimizaciones de rendimiento
- [ ] Documentación completa

## 8. Consideraciones Adicionales

### 8.1 Experiencia del Usuario
- **Transparencia**: Informar al usuario sobre limitaciones de contexto
- **Control**: Permitir ajustar configuraciones de contexto
- **Feedback**: Indicar cuando se activan resúmenes

### 8.2 Rendimiento
- **Caché de resúmenes**: Evitar regenerar resúmenes idénticos
- **Procesamiento asíncrono**: Generar resúmenes en background
- **Optimización de tokens**: Minimizar overhead de gestión

### 8.3 Escalabilidad
- **Configuración por modelo**: Diferentes límites según el modelo usado
- **Adaptación dinámica**: Ajustar estrategia según rendimiento
- **Fallbacks**: Estrategias de respaldo en caso de errores

Esta estrategia proporciona una base sólida para manejar el contexto de manera eficiente mientras mantiene la calidad de la experiencia conversacional.