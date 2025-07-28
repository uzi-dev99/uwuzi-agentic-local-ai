# Diferencias entre Documentos del Proyecto Wuzi

## Pregunta del Usuario
¿Cuál es la diferencia entre `Plan_de_Accion_v2.md` y `Cambios_Plan_v2.md`? ¿Por qué tenemos dos documentos?

## Respuesta

### 📋 Plan_de_Accion_v2.md
**Propósito**: Es el **documento principal de trabajo** del proyecto.

**Características**:
- ✅ **Lista de tareas ejecutables**: Contiene checkboxes `[ ]` y `[x]` para marcar progreso
- ✅ **Guía paso a paso**: Instrucciones detalladas para cada fase del proyecto
- ✅ **Documento vivo**: Se actualiza constantemente conforme se completan tareas
- ✅ **Referencia técnica**: Incluye comandos, configuraciones y código específico
- ✅ **Secuencial**: Diseñado para seguirse en orden específico

**Contenido**:
- Fases completas del proyecto (1, 2, 2.5, 2.6, 3)
- Tareas específicas con checkboxes de estado
- Configuraciones técnicas detalladas
- Comandos de prueba y validación
- Especificaciones del modelo Gemma 3n

### 📝 Cambios_Plan_v2.md
**Propósito**: Es un **documento de registro histórico** de cambios.

**Características**:
- 📚 **Documentación de cambios**: Explica QUÉ se cambió y POR QUÉ
- 📚 **Contexto histórico**: Muestra la evolución del proyecto
- 📚 **Resumen ejecutivo**: Información condensada para stakeholders
- 📚 **Comparativo**: Antes vs Después de las actualizaciones
- 📚 **Estático**: No se modifica frecuentemente, es un registro

**Contenido**:
- Resumen de actualizaciones realizadas
- Comparación entre versiones anteriores y actuales
- Beneficios de los cambios implementados
- Consideraciones técnicas y de compatibilidad

## ¿Por qué Dos Documentos?

### 🎯 **Separación de Responsabilidades**

| Aspecto | Plan_de_Accion_v2.md | Cambios_Plan_v2.md |
|---------|---------------------|--------------------|
| **Función** | Guía de trabajo activa | Registro de cambios |
| **Audiencia** | Desarrolladores ejecutando tareas | Stakeholders y revisores |
| **Frecuencia de cambio** | Constante (cada tarea completada) | Ocasional (cada versión) |
| **Tipo de información** | Instrucciones técnicas detalladas | Resumen ejecutivo y contexto |
| **Formato** | Lista de tareas con checkboxes | Narrativa descriptiva |

### 🔄 **Flujo de Trabajo**

1. **Plan_de_Accion_v2.md** → Se usa para ejecutar el trabajo diario
2. **Cambios_Plan_v2.md** → Se crea cuando hay actualizaciones significativas
3. **Actualizacion_Gemma3n.md** → Documenta cambios específicos de tecnología

### 📊 **Analogía**

- **Plan_de_Accion_v2.md** = Lista de tareas de un proyecto en Jira/Trello
- **Cambios_Plan_v2.md** = Release notes o changelog
- **Actualizacion_Gemma3n.md** = Documentación técnica específica

## Actualización del Modelo

### ✅ **Cambio Realizado**
Se actualizó el modelo de:
- **Anterior**: `google/gemma-3n-2b-it` / `google/gemma-3n-4b-it`
- **Nuevo**: `gemma3n:e4b`

### 🔧 **Razón del Cambio**
- **Formato Ollama**: `gemma3n:e4b` es el nombre correcto para Ollama local
- **Arquitectura E4B**: Utiliza la versión con parámetros anidados optimizados
- **Compatibilidad**: Funciona directamente con la instalación local de Ollama

### 📁 **Archivos Actualizados**
1. `Plan_de_Accion_v2.md` - Configuración principal
2. `backend/.env` - Variables de entorno
3. `docs/Actualizacion_Gemma3n.md` - Documentación técnica

## Recomendación de Uso

### 👨‍💻 **Para Desarrolladores**
- **Usar**: `Plan_de_Accion_v2.md` como guía principal de trabajo
- **Consultar**: `Cambios_Plan_v2.md` para entender el contexto de cambios
- **Referir**: `Actualizacion_Gemma3n.md` para detalles técnicos específicos

### 👔 **Para Stakeholders**
- **Leer**: `Cambios_Plan_v2.md` para entender el progreso y beneficios
- **Revisar**: `Actualizacion_Gemma3n.md` para impacto técnico
- **Monitorear**: `Plan_de_Accion_v2.md` para ver progreso de tareas

## Conclusión

Tener múltiples documentos es una **buena práctica** que permite:
- ✅ **Separar preocupaciones**: Trabajo vs Documentación
- ✅ **Diferentes audiencias**: Técnica vs Ejecutiva
- ✅ **Mantenimiento**: Cada documento tiene su propósito específico
- ✅ **Trazabilidad**: Historial claro de cambios y decisiones

Esto es similar a tener un README.md (guía), CHANGELOG.md (cambios) y CONTRIBUTING.md (proceso) en un repositorio de código.