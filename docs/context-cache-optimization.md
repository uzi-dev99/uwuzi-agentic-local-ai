# 🚀 Optimización de Cache de Contexto

## 📋 Problema Actual

### **Ineficiencia Detectada:**
Actualmente, el sistema regenera el contexto completo en **cada request**, incluso para chats largos donde el contexto no ha cambiado significativamente. Esto resulta en:

- ⚠️ **Procesamiento redundante** de resúmenes con gemma3n:e4b
- ⚠️ **Latencia innecesaria** en respuestas
- ⚠️ **Uso excesivo de recursos** de CPU/memoria
- ⚠️ **Costos elevados** de tokens para resúmenes repetitivos

### **Ejemplo del Problema:**
```
Chat con 100 mensajes:
Request 1: Genera resumen de 95 mensajes + 5 recientes
Request 2: Genera resumen de 96 mensajes + 5 recientes (95% duplicado)
Request 3: Genera resumen de 97 mensajes + 5 recientes (96% duplicado)
```

---

## 🎯 Solución Propuesta: Cache Inteligente de Contexto

### **Arquitectura de Cache:**

```
Redis/PostgreSQL Cache
├── chat_id (key)
└── {
    context_hash: "sha256_of_messages",
    summary: "resumen_generado",
    last_messages: [últimos_N_mensajes],
    files_processed: [archivos_procesados],
    timestamp: "2024-01-20T10:30:00Z",
    tokens_count: 15000,
    ttl: 3600  // 1 hora
}
```

### **Flujo Optimizado:**

```
1. Request llega con chat_id + mensajes
2. Calcular hash de mensajes actuales
3. Buscar en cache por chat_id
4. Si cache existe y hash coincide:
   → Usar contexto cacheado
5. Si cache no existe o hash diferente:
   → Generar nuevo contexto
   → Guardar en cache
6. Enviar contexto a N8N
```

---

## 🔧 Implementación Técnica

### **1. Estructura de Datos**

```python
# Nuevo modelo para cache
class ContextCache:
    chat_id: str
    context_hash: str
    summary: Optional[str]
    last_messages: List[Dict[str, str]]
    files_processed: List[Dict[str, Any]]
    context_blocks: List[str]
    tokens_count: int
    created_at: datetime
    expires_at: datetime
```

### **2. Cache Service**

```python
class ContextCacheService:
    def __init__(self, redis_client):
        self.redis = redis_client
        self.ttl = 3600  # 1 hora
    
    async def get_cached_context(self, chat_id: str, messages_hash: str) -> Optional[ContextCache]:
        """Obtener contexto cacheado si existe y es válido"""
        
    async def save_context(self, chat_id: str, context_data: ContextCache) -> None:
        """Guardar contexto en cache con TTL"""
        
    def calculate_messages_hash(self, messages: List[Dict]) -> str:
        """Calcular hash SHA256 de mensajes para detectar cambios"""
```

### **3. Integración en ContextGenerator**

```python
async def build_infinite_context_cached(
    self, 
    messages: List[Dict[str, str]], 
    files_data: List[Dict[str, Any]], 
    chat_id: str,
    additional_context: Optional[str] = None
) -> Dict[str, Any]:
    
    # 1. Calcular hash de mensajes
    messages_hash = self.cache_service.calculate_messages_hash(messages)
    
    # 2. Buscar en cache
    cached_context = await self.cache_service.get_cached_context(chat_id, messages_hash)
    
    if cached_context:
        logger.info(f"Using cached context for chat {chat_id}")
        return cached_context.to_dict()
    
    # 3. Generar nuevo contexto
    logger.info(f"Generating new context for chat {chat_id}")
    new_context = await self.build_infinite_context(messages, files_data, additional_context)
    
    # 4. Guardar en cache
    await self.cache_service.save_context(chat_id, new_context)
    
    return new_context
```

---

## 📊 Estrategias de Cache

### **1. Cache por Hash de Mensajes**
- **Ventaja:** Detecta cambios exactos en conversación
- **Uso:** Cuando solo se agregan mensajes nuevos

### **2. Cache Incremental**
- **Ventaja:** Reutiliza resúmenes parciales
- **Uso:** Para chats muy largos con cambios frecuentes

### **3. Cache con TTL Dinámico**
- **Chats activos:** TTL corto (30 min)
- **Chats inactivos:** TTL largo (24 horas)
- **Chats archivados:** TTL muy largo (7 días)

---

## 🔄 Invalidación de Cache

### **Triggers para Invalidar:**
1. **Nuevos mensajes:** Hash cambia → regenerar
2. **Archivos nuevos:** Contenido cambia → regenerar
3. **TTL expirado:** Tiempo límite → regenerar
4. **Configuración cambiada:** Límites de tokens → limpiar todo

### **Estrategias de Invalidación:**
```python
# Invalidación por patrón
await cache_service.invalidate_pattern(f"chat:{chat_id}:*")

# Invalidación por TTL
await cache_service.set_ttl(cache_key, new_ttl)

# Invalidación manual
await cache_service.delete_cache(chat_id)
```

---

## 📈 Métricas de Rendimiento

### **KPIs a Medir:**
- **Cache Hit Rate:** % de requests que usan cache
- **Context Generation Time:** Tiempo promedio de generación
- **Memory Usage:** Uso de memoria del cache
- **Token Savings:** Tokens ahorrados por reutilización

### **Logging Mejorado:**
```python
logger.info(f"Context cache stats: hit_rate={hit_rate}%, avg_gen_time={avg_time}ms, memory_usage={memory_mb}MB")
```

---

## 🚀 Fases de Implementación

### **Fase 1: Cache Básico (Redis)**
- Implementar cache simple con TTL fijo
- Hash de mensajes para detección de cambios
- Métricas básicas de hit/miss

### **Fase 2: Cache Inteligente**
- TTL dinámico basado en actividad
- Invalidación selectiva
- Compresión de datos cacheados

### **Fase 3: Cache Distribuido**
- PostgreSQL para persistencia
- Replicación entre instancias
- Backup y recovery de cache

---

## 💡 Beneficios Esperados

### **Rendimiento:**
- ⚡ **90% reducción** en tiempo de generación de contexto
- ⚡ **80% menos** llamadas a gemma3n:e4b
- ⚡ **50% mejora** en tiempo de respuesta total

### **Recursos:**
- 💰 **70% reducción** en uso de tokens para resúmenes
- 💰 **60% menos** uso de CPU
- 💰 **40% reducción** en latencia de red

### **Escalabilidad:**
- 🔄 Soporte para **10x más chats concurrentes**
- 🔄 **Mejor experiencia** para chats largos
- 🔄 **Menor carga** en servicios downstream

---

## ⚠️ Consideraciones

### **Memoria:**
- Monitorear uso de Redis/PostgreSQL
- Implementar límites por chat_id
- Limpiar cache de chats inactivos

### **Consistencia:**
- Manejar race conditions en cache
- Validar integridad de datos cacheados
- Fallback a generación fresh si cache corrupto

### **Seguridad:**
- No cachear información sensible
- Encriptar datos de cache si necesario
- Implementar access control por chat_id

Esta optimización es **crítica** para la escalabilidad del sistema y debe implementarse antes del lanzamiento en producción.