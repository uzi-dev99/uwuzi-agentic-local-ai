# 5. Flujo de Datos y Servicios

Entender cómo fluyen los datos es clave para modificar o depurar la aplicación. El flujo principal gira en torno a la interacción del usuario, la actualización del estado y la comunicación con el backend personalizado que utiliza Ollama y N8N.

### Flujo de Envío de un Mensaje

1.  **`MessageInput.tsx`**: El usuario escribe un mensaje y/o adjunta un archivo y hace clic en "Enviar".
2.  El componente empaqueta el mensaje en un objeto. Aquí ocurre una distinción clave:
    -   `content`: El contenido que se mostrará en la UI. Para un archivo de texto, puede ser `(File Attached: mi_archivo.txt) Hola`.
    -   `apiContent`: El contenido que se enviará a la API. Para el mismo archivo, sería el contenido completo del fichero de texto seguido de "Hola".
3.  Se llama a la función `handleSendMessage` en `ChatPage.tsx` con este objeto.
4.  **`ChatPage.tsx`**:
    -   Llama a `addMessage` del `ChatContext` para añadir el mensaje del usuario a la lista de mensajes (usando `content` para la UI).
    -   Llama de nuevo a `addMessage` para crear un *placeholder* vacío para la respuesta del asistente. Esto es clave para la UX, ya que la burbuja del asistente aparece inmediatamente con una animación de carga.
    -   Obtiene el ID del mensaje del asistente recién creado.
5.  **`backendService.ts`**:
    -   `ChatPage` llama a `invokeAgent`, pasándole el historial de chat completo (usando `apiContent` si está disponible).
    -   El servicio prepara el payload para el backend, convirtiendo los mensajes al formato esperado por el agente.
    -   Realiza una petición POST al endpoint `/api/v1/agent/invoke` y procesa la respuesta en streaming.
6.  **Actualización en Tiempo Real**:
    -   `backendService` procesa el stream de respuesta línea por línea, parseando cada chunk JSON.
    -   Con cada `chunk` de texto recibido, se ejecuta el callback `onChunk` que llama a `updateAssistantMessage` del `ChatContext`.
    -   `ChatContext` encuentra el mensaje placeholder del asistente por su ID y le añade el `chunk` de texto.
    -   Este cambio de estado provoca que `MessageList` se re-renderice, mostrando la respuesta de la IA en tiempo real.

### Manejo de Archivos

-   **`useFileUpload.ts`**: Este hook es el responsable de leer los archivos seleccionados por el usuario.
    -   Distingue entre tipos de archivo (imagen, texto, otros).
    -   Lee las imágenes como `DataURL` (base64).
    -   Lee los archivos de texto (`.txt`, `.md`) como texto plano.
    -   Para otros archivos (como `.pdf`), no lee el contenido pero devuelve sus metadatos (nombre) para que puedan ser referenciados en el chat.
-   El resultado de este hook es lo que `MessageInput` utiliza para construir los campos `content` y `apiContent`.

### Gestión de Errores

-   **UI**: Los errores de permisos (micrófono, cámara) o de carga de archivos se capturan en los hooks correspondientes y se muestran en la interfaz de `MessageInput`.
-   **API**: Si la llamada al backend falla, el `catch` en `invokeAgent` captura el error y ejecuta el callback `onError`, mostrando un mensaje de error legible por el usuario en la burbuja de respuesta del asistente.
