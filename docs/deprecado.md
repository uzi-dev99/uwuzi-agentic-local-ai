Plan de Acción v2: De Prototipo a APK con Backend Inteligente Multimodal
Este documento es una lista de tareas secuencial para transformar la aplicación Wuzi. El objetivo es evolucionar de un prototipo conectado a una API externa a una aplicación robusta con un backend propio que actúa como agente enrutador multimodal usando Gemma 3n, y finalmente, empaquetarla como una aplicación nativa para Android.
Modelo Base: Gemma 3n (google/gemma-3n-2b-it / google/gemma-3n-4b-it)
Especificaciones Técnicas:
* 🔥 Contexto de 32,000 tokens: Capacidad de procesamiento de contexto sustancial.
* 🚀 Arquitectura MatFormer: Modelos anidados para optimización de recursos.
* 💾 Caché PLE: Parámetros de incorporación por capa almacenables en caché.
* ⚡ Carga Condicional: Omisión de parámetros de audio/visual para ahorrar memoria.
* 🌍 140+ idiomas: Soporte multilingüe extenso.
* 📱 Optimizado para dispositivos: Diseñado para teléfonos, laptops y tablets.
Capacidades Multimodales:
* ✅ Procesamiento de texto: Análisis y generación de texto avanzado.
* ✅ Entrada visual: Codificador MobileNet-V5 para procesamiento de imágenes.
* ✅ Entrada de audio: Reconocimiento de voz, traducción y análisis de audio.
* ✅ Conversaciones multi-turno: Mantenimiento de contexto en conversaciones largas.
* ✅ Seguimiento de instrucciones complejas: Comprensión contextual avanzada.
Optimizaciones de Parámetros:
* Modelo E2B: ~5B parámetros totales, ~1.9B parámetros efectivos con optimizaciones.
* Modelo E4B: Contiene parámetros del E2B + adicionales, arquitectura anidada.
* Técnicas de eficiencia: PLE caché, MatFormer, carga condicional de parámetros.
Fase 1: Refactorización del Backend (Agente Enrutador)
Objetivo: Convertir el backend de FastAPI en un "agente" inteligente que reciba todas las peticiones, determine la intención del usuario y las enrute al servicio apropiado (Ollama para chat, n8n para workflows).
1.1. Preparación y Estructura del Proyecto
* [x] Verificar Estructura de Carpetas: Asegúrate de que la estructura del proyecto backend sea la siguiente:
/backend
|-- main.py
|-- requirements.txt
|-- .env
|-- /services
|   |-- __init__.py
|   |-- agent_service.py
|   |-- chat_service.py
|   |-- n8n_service.py
|-- /models
   |-- __init__.py
   |-- agent_models.py

* [x] Actualizar Dependencias (requirements.txt): Asegúrate de que el archivo contenga las librerías necesarias.
fastapi
uvicorn
httpx
python-dotenv

* [x] Configurar Variables de Entorno (.env): Crea o actualiza el archivo .env en la raíz de /backend.
OLLAMA_API_URL="http://localhost:11434/api/chat"
N8N_SALES_REPORT_WEBHOOK="TU_WEBHOOK_DE_N8N_AQUI"
AGENT_ROUTER_MODEL="gemma3n:e4b"
# Nota: Modelo Ollama local con arquitectura E4B (parámetros anidados optimizados)

# Configuración específica para Gemma 3n
GEMMA_CONTEXT_LENGTH=32000
GEMMA_ENABLE_PLE_CACHE=true
GEMMA_CONDITIONAL_LOADING=true
GEMMA_MATFORMER_MODE=true

1.2. Implementación de Servicios
   * [x] Implementar services/chat_service.py: Este servicio se comunicará con Ollama para el chat conversacional.
   * Crea una función asíncrona stream_chat_with_ollama(messages: list) que reciba el historial de mensajes.
   * Dentro de la función, usa httpx.AsyncClient para hacer una petición POST a la OLLAMA_API_URL.
   * Asegúrate de que el payload incluya {"stream": True}.
   * La función debe ser un generador (async for ... yield) que devuelva los chunks de datos tal como los recibe de Ollama.
   * [x] Implementar services/n8n_service.py (Placeholder): Este servicio activará los workflows en n8n.
   * Crea una función asíncrona trigger_sales_report(params: dict).
   * Dentro de la función, usa httpx.AsyncClient para hacer una petición POST a la N8N_SALES_REPORT_WEBHOOK.
   * La función debe devolver un diccionario con el estado de la operación (ej: {"status": "success", "message": "Reporte de ventas en proceso."}).
   * [x] Implementar el Agente (services/agent_service.py): Este es el cerebro del backend.
   * classify_intent(user_prompt: str):
   * Crea una función asíncrona para determinar la intención.
   * Define un system_prompt claro que instruya al AGENT_ROUTER_MODEL para que clasifique el user_prompt y devuelva una categoría específica (ej: conversational_chat, sales_report_workflow).
   * Realiza una petición POST (no streaming) a Ollama con el system_prompt y el user_prompt.
   * Extrae y devuelve la categoría de la respuesta del modelo.
   * invoke_agent(request_data: dict):
   * Crea la función generadora asíncrona principal.
   * Extrae el último mensaje del usuario del request_data.
   * Llama a classify_intent para obtener la intención.
   * Usa una estructura if/elif/else basada en la intent:
   * Si la intención es sales_report_workflow, llama a n8n_service.trigger_sales_report y usa yield para devolver su resultado como un único chunk.
   * Si no, (por defecto conversational_chat), itera sobre el generador chat_service.stream_chat_with_ollama y usa yield para pasar cada chunk al cliente.
1.3 Exponer el Endpoint Principal
   * [x] Actualizar main.py:
   * Elimina cualquier endpoint antiguo (como /direct_chat).
   * Importa el agent_service.
   * Configura CORSMiddleware para permitir peticiones desde el frontend durante el desarrollo (http://localhost:5173).
   * Crea un único endpoint POST en la ruta /api/v1/agent/invoke.
   * Dentro de este endpoint, llama a agent_service.invoke_agent con el cuerpo de la petición.
   * Envuelve la llamada en un StreamingResponse con media_type="application/x-ndjson".
1.4. Pruebas del Backend
   * [x] Prueba de Endpoint: Una vez que el backend esté corriendo, usa una herramienta como curl para probar el endpoint y verificar que el enrutamiento funciona.
# Prueba de chat conversacional
curl -X POST http://localhost:8000/api/v1/agent/invoke -H "Content-Type: application/json" -d '{"messages": [{"role": "user", "content": "Hola, ¿cómo estás?"}]}'

# Prueba de workflow (simulada)
curl -X POST http://localhost:8000/api/v1/agent/invoke -H "Content-Type: application/json" -d '{"messages": [{"role": "user", "content": "Genera el reporte de ventas"}]}'

Fase 2: Adaptación del Frontend (React)
Objetivo: Desconectar el frontend de la API de Gemini y conectarlo exclusivamente al nuevo endpoint del agente en nuestro backend.
      * [x] Configurar Variables de Entorno (frontend/.env.local):
      * Elimina cualquier clave de API de Gemini.
      * Añade la URL del backend. Para producción, será la URL pública.
VITE_BACKEND_API_URL=https://backend-nodo-uno.wuzi.uk/api/v1

         * [x] Crear Nuevo Servicio de API (src/services/backendService.ts):
         * Crea un nuevo archivo para la comunicación con tu backend.
         * Define una función asíncrona invokeAgent(messages: Message[], onChunk: (chunk: string) => void, onError: (error: Error) => void).
         * Dentro de la función, usa fetch para hacer una petición POST a ${VITE_BACKEND_API_URL}/agent/invoke.
         * Adapta el array de messages al formato que espera el backend (ej: {role: msg.role, content: msg.text}).
         * Implementa la lógica para leer la respuesta como un stream (response.body.getReader()).
         * Decodifica cada value del stream y procesa los chunks de JSON delimitados por saltos de línea (\n).
         * Por cada chunk de contenido válido, llama al callback onChunk(contenido).
         * [x] Integrar el Nuevo Servicio en la Lógica del Chat:
         * Ve al archivo que gestiona el envío de mensajes (probablemente src/contexts/ChatContext.tsx).
         * Importa la nueva función invokeAgent de backendService.ts.
         * En la función que envía el mensaje (handleSendMessage o similar), reemplaza la llamada a la API de Gemini por una llamada a invokeAgent.
         * Pasa las funciones de callback para onChunk (que actualiza el mensaje del asistente en el estado de React) y onError (que muestra un mensaje de error).
         * [x] Limpieza del Proyecto:
         * Elimina el archivo src/services/geminiService.ts.
         * Busca y elimina cualquier referencia restante a Gemini o su API key en todo el proyecto.
         * [x] Pruebas Full-Stack:
         * Ejecuta el backend y el frontend simultáneamente.
         * Abre la aplicación web en tu navegador.
         * Prueba ambas funcionalidades: el chat conversacional y la activación de un workflow. Verifica que la UI se actualice correctamente en ambos casos.
Fase 2.5: Establecimiento de Chat Estable con Ollama
Objetivo: Garantizar que el frontend pueda mantener conversaciones fluidas y estables con modelos de Ollama a través del backend HTTPS, específicamente en modo chat conversacional.
2.5.1. Verificación de Conectividad con Ollama
         * [ ] Verificar Ollama Local: Confirmar que Ollama está ejecutándose localmente y responde correctamente.
         * [ ] Probar Conexión Directa: Realizar pruebas directas desde el backend hacia Ollama para verificar la comunicación.
         * [ ] Validar Modelos Disponibles: Confirmar que el modelo configurado (llama3) está disponible y funcional.
2.5.2. Estrategia de Gestión de Contexto y Memoria
         * [ ] Análisis de Limitaciones de Contexto:
         * Determinar el límite de tokens del modelo Ollama configurado.
         * Calcular cuántos mensajes promedio caben en el contexto.
         * Establecer umbrales de memoria (ej: 80% del límite).
         * [ ] Implementación de Gestión de Contexto:
         * Estrategia de Ventana Deslizante: Mantener los N mensajes más recientes.
         * Preservación de Contexto Inicial: Siempre mantener el primer mensaje del chat.
         * Resumen Inteligente: Generar resúmenes de conversaciones largas.
         * Compresión de Mensajes: Optimizar mensajes largos sin perder información clave.
         * [ ] Configuración de Parámetros:
         * MAX_CONTEXT_MESSAGES: Número máximo de mensajes en contexto (ej: 20).
         * CONTEXT_WINDOW_SIZE: Tamaño de ventana deslizante (ej: 15 mensajes).
         * SUMMARY_THRESHOLD: Umbral para activar resumen (ej: 25 mensajes).
         * PRESERVE_SYSTEM_MESSAGES: Mantener mensajes del sistema siempre.
         * [ ] Implementación en Backend:
         * Crear función manage_context() en chat_service.py.
         * Implementar lógica de truncamiento inteligente.
         * Añadir generación de resúmenes automáticos.
         * Optimizar el payload enviado a Ollama.
         * [ ] Implementación en Frontend:
         * Mostrar indicador de contexto limitado al usuario.
         * Opción para ver historial completo vs contexto activo.
         * Notificación cuando se activa el resumen automático.
2.5.3. Depuración del Servicio de Chat
         * [ ] Revisar chat_service.py: Analizar y corregir cualquier problema en la comunicación con Ollama.
         * [ ] Implementar Logging Detallado: Añadir logs específicos para rastrear el flujo de datos entre frontend, backend y Ollama.
         * [ ] Manejar Errores de Conexión: Implementar manejo robusto de errores cuando Ollama no esté disponible.
2.5.4. Optimización del Frontend para Chat
         * [ ] Verificar Streaming de Respuestas: Asegurar que el frontend procesa correctamente las respuestas en streaming de Ollama.
         * [ ] Implementar Indicadores de Estado: Añadir indicadores visuales de "escribiendo" y manejo de errores de conexión.
         * [ ] Probar Conversaciones Largas: Verificar que el historial de mensajes se mantiene correctamente en conversaciones extensas.
2.5.5. Pruebas de Estabilidad
         * [ ] Chat Continuo: Realizar múltiples intercambios de mensajes para verificar estabilidad.
         * [ ] Manejo de Reconexión: Probar el comportamiento cuando se pierde y recupera la conexión.
         * [ ] Rendimiento: Verificar que las respuestas llegan en tiempo razonable y sin interrupciones.
2.5.6. Validación Final del Chat
         * [ ] Conversación Completa: Mantener una conversación de al menos 10 intercambios exitosos.
         * [ ] Diferentes Tipos de Consultas: Probar preguntas cortas, largas, técnicas y conversacionales.
         * [ ] Estabilidad Prolongada: Verificar que el chat funciona de manera estable durante al menos 15 minutos de uso continuo.
Fase 2.6: Implementación de Capacidades Multimodales con Gemma 3n
Objetivo: Aprovechar las capacidades multimodales avanzadas de Gemma 3n para procesar imágenes y audio además de texto, utilizando sus técnicas de optimización de parámetros.
2.6.1. Configuración del Modelo Multimodal
         * [ ] Actualizar Configuración del Backend:
         * Cambiar AGENT_ROUTER_MODEL a "google/gemma-3n-2b-it" o "google/gemma-3n-4b-it" en .env.
         * Verificar que Ollama tiene el modelo Gemma 3n disponible.
         * Configurar parámetros específicos para procesamiento multimodal.
         * Habilitar contexto extendido de 32,000 tokens.
         * Configurar técnicas de optimización (PLE caché, MatFormer, carga condicional).
         * [ ] Adaptar chat_service.py para Multimodalidad:
         * Modificar stream_chat_with_ollama para soportar mensajes con imágenes.
         * Implementar manejo de diferentes tipos de contenido (text, image, audio).
         * Añadir validación de formatos de archivo soportados.
2.6.2. Soporte de Imágenes
         * [ ] Backend - Procesamiento de Imágenes:
         * Implementar endpoint para subida de imágenes.
         * Añadir validación de tipos de archivo (jpg, png, webp).
         * Configurar límites de tamaño de archivo.
         * Implementar conversión a base64 para envío a Ollama.
         * [ ] Frontend - Interfaz de Imágenes:
         * Actualizar MessageInput.tsx para soportar selección de imágenes.
         * Añadir preview de imágenes antes del envío.
         * Implementar drag & drop para imágenes.
         * Mostrar imágenes en el historial de mensajes.
         * [ ] Integración con Gemma 3n:
         * Adaptar formato de mensajes para incluir imágenes con codificador MobileNet-V5.
         * Usar tokens especiales <image_soft_token> según documentación.
         * Implementar plantillas de instrucción multimodales.
         * Aprovechar el contexto extendido de 32,000 tokens para imágenes complejas.
         * Configurar carga condicional de parámetros visuales.
2.6.3. Soporte de Audio
         * [ ] Backend - Procesamiento de Audio:
         * Implementar endpoint para subida de archivos de audio.
         * Añadir validación de formatos (wav, mp3, m4a).
         * Configurar límites de duración y tamaño.
         * Implementar conversión de formatos si es necesario.
         * [ ] Frontend - Interfaz de Audio:
         * Integrar grabación de audio en tiempo real.
         * Añadir controles de reproducción para audio.
         * Implementar visualización de ondas de audio.
         * Mostrar archivos de audio en el historial.
         * [ ] Integración con Gemma 3n:
         * Usar tokens <audio_soft_token> para audio.
         * Implementar plantillas de instrucción para audio.
         * Configurar procesamiento de transcripción y análisis.
         * Aprovechar soporte nativo para reconocimiento de voz y traducción.
         * Utilizar contexto de 32,000 tokens para análisis de audio largo.
         * Configurar carga condicional de parámetros de audio.
2.6.4. Optimización Multimodal
         * [ ] Gestión de Contexto Multimodal Extendido:
         * Adaptar estrategia de gestión de contexto para aprovechar 32,000 tokens.
         * Implementar compresión inteligente de imágenes en contexto.
         * Optimizar almacenamiento temporal de archivos multimedia.
         * Configurar ventana deslizante inteligente para contenido multimodal.
         * [ ] Técnicas de Optimización Gemma 3n:
         * Implementar caché PLE para parámetros de incorporación por capa.
         * Configurar arquitectura MatFormer para modelos anidados.
         * Habilitar carga condicional de parámetros (audio/visual).
         * Optimizar uso de memoria con parámetros efectivos.
         * Configurar almacenamiento en caché local rápido para PLE.
         * [ ] Rendimiento y Caché Avanzado:
         * Implementar caché para imágenes procesadas con MobileNet-V5.
         * Optimizar tiempo de respuesta para contenido multimodal.
         * Configurar límites de memoria dinámicos según disponibilidad.
         * Implementar selección automática entre E2B y E4B según recursos.
2.6.5. Pruebas Multimodales
         * [ ] Pruebas de Imágenes:
         * Enviar imágenes simples con preguntas descriptivas.
         * Probar análisis de contenido visual.
         * Verificar manejo de múltiples imágenes en una conversación.
         * [ ] Pruebas de Audio:
         * Enviar archivos de audio para transcripción.
         * Probar análisis de contenido de audio.
         * Verificar calidad de transcripción en diferentes idiomas.
         * [ ] Pruebas Combinadas:
         * Conversaciones con texto, imágenes y audio mezclados.
         * Verificar coherencia en respuestas multimodales.
         * Probar límites de procesamiento simultáneo.
Fase 3: Empaquetado para Android (Creación del APK)
Objetivo: Envolver la aplicación web de React en un contenedor nativo para crear un archivo .apk instalable en dispositivos Android. Usaremos Capacitor, el sucesor moderno de Cordova.
3.1. Prerrequisitos
         * [ ] Instalar Android Studio: Descárgalo e instálalo desde el sitio oficial de Android.
         * [ ] Instalar un JDK (Java Development Kit): Android Studio suele venir con uno, pero puedes instalarlo por separado si es necesario (se recomienda OpenJDK).
3.2. Preparar el Proyecto de React para Capacitor
         * [ ] Instalar Dependencias de Capacitor: En la terminal, dentro de la carpeta /frontend, ejecuta:
npm install @capacitor/core @capacitor/cli @capacitor/android

         * [ ] Inicializar Capacitor: Este comando crea el archivo de configuración de Capacitor.
npx cap init "Wuzi Assist" "uk.wuzi.assist" --web-dir "dist"

            * "Wuzi Assist": El nombre de tu aplicación que aparecerá en el teléfono.
            * "uk.wuzi.assist": El ID único del paquete (formato de dominio inverso).
            * --web-dir "dist": Le dice a Capacitor que los archivos de tu web de producción estarán en la carpeta /dist.
3.3. Construcción y Sincronización
            * [ ] Construir la Aplicación de React: Crea la versión de producción de tu app.
npm run build

            * [ ] Añadir la Plataforma Android: Este comando crea una carpeta /android dentro de tu proyecto de frontend que contiene un proyecto nativo de Android.
npx cap add android

            * [ ] Sincronizar los Archivos Web: Copia los últimos cambios de tu carpeta /dist al proyecto nativo de Android. Debes ejecutar este comando cada vez que hagas cambios en tu código de React.
npx cap sync

3.4. Configuración en Android Studio
               * [ ] Abrir el Proyecto Nativo:
npx cap open android

Esto abrirá Android Studio con tu proyecto.
               * [ ] Configurar Permisos de Red:
                  * En Android Studio, busca el archivo android/app/src/main/AndroidManifest.xml.
                  * Asegúrate de que el permiso de internet esté presente justo antes de la etiqueta <application>:
<uses-permission android:name="android.permission.INTERNET" />

                     * [ ] Verificar la URL del Servidor (Opcional, pero recomendado):
                     * En el archivo capacitor.config.ts de tu proyecto de React, puedes configurar la URL del servidor para que la app sepa a dónde apuntar.
// capacitor.config.ts
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
 // ...
 server: {
   hostname: 'backend-nodo-uno.wuzi.uk',
   androidScheme: 'https'
 }
};

export default config;

                     * Después de cambiar esto, vuelve a ejecutar npx cap sync.
3.5. Generar el APK Firmado
                        * [ ] Crear una Clave de Firma (Keystore):
                        * En Android Studio, ve a Build > Generate Signed Bundle / APK....
                        * Selecciona APK y haz clic en Next.
                        * Haz clic en Create new... debajo del campo "Key store path".
                        * Rellena el formulario para crear tu archivo de clave (.jks). Guarda este archivo y sus contraseñas en un lugar seguro. Lo necesitarás para todas las futuras actualizaciones de tu app.
                        * Haz clic en OK.
                        * [ ] Generar el APK:
                        * Con los datos de tu keystore ya cargados, selecciona el tipo de build release.
                        * Haz clic en Create.
                        * Una vez que termine el proceso, Android Studio mostrará una notificación con un enlace para locate (localizar) tu APK. El archivo estará típicamente en frontend/android/app/release/app-release.apk.
                        * [ ] ¡Listo! Ya tienes tu archivo .apk que puedes instalar en un dispositivo Android para probar.