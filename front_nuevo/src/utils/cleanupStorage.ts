/**
 * Utilidad para limpiar URLs de blob obsoletas y datos corruptos del localStorage
 */

export const cleanupObsoleteBlobUrls = () => {
  console.log('🧹 Iniciando limpieza de URLs de blob obsoletas...');
  
  let cleanedCount = 0;
  let totalMessages = 0;
  
  try {
    // Iterar sobre todas las claves del localStorage
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      
      if (key && key.startsWith('chatMessages-')) {
        try {
          const storedData = localStorage.getItem(key);
          if (!storedData) continue;
          
          const messages = JSON.parse(storedData);
          if (!Array.isArray(messages)) continue;
          
          totalMessages += messages.length;
          
          // Limpiar mensajes con URLs de blob obsoletas
          const cleanedMessages = messages.map((msg: any) => {
            if (msg.type === 'audio' && msg.audioUrl) {
              // Remover URLs que apunten al puerto 3000 o que sean inválidas
              if (msg.audioUrl.includes('localhost:3000') || 
                  msg.audioUrl.includes('127.0.0.1:3000') ||
                  !msg.audioUrl.startsWith('blob:')) {
                cleanedCount++;
                console.log(`🗑️ Removiendo URL obsoleta: ${msg.audioUrl}`);
                return { ...msg, audioUrl: undefined };
              }
            }
            return msg;
          });
          
          // Guardar los mensajes limpios
          localStorage.setItem(key, JSON.stringify(cleanedMessages));
          
        } catch (error) {
          console.error(`❌ Error procesando ${key}:`, error);
          // Si hay error de parsing, eliminar la clave completamente
          localStorage.removeItem(key);
        }
      }
    }
    
    console.log(`✅ Limpieza completada:`);
    console.log(`   - Mensajes procesados: ${totalMessages}`);
    console.log(`   - URLs obsoletas removidas: ${cleanedCount}`);
    
  } catch (error) {
    console.error('❌ Error durante la limpieza:', error);
  }
};

/**
 * Limpia completamente todos los datos de chat del localStorage
 * ⚠️ CUIDADO: Esta función elimina TODOS los chats guardados
 */
export const clearAllChatData = () => {
  const confirmed = confirm(
    '⚠️ ADVERTENCIA: Esto eliminará TODOS los chats guardados.\n\n' +
    'Esta acción no se puede deshacer.\n\n' +
    '¿Estás seguro de que quieres continuar?'
  );
  
  if (!confirmed) {
    console.log('🚫 Limpieza cancelada por el usuario');
    return;
  }
  
  console.log('🧹 Iniciando limpieza completa de datos de chat...');
  
  let removedCount = 0;
  
  try {
    // Remover todas las claves relacionadas con chats
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      
      if (key && (key.startsWith('chatMessages-') || 
                  key === 'chatMessages' ||
                  key === 'chat-storage')) {
        localStorage.removeItem(key);
        removedCount++;
        console.log(`🗑️ Removido: ${key}`);
      }
    }
    
    console.log(`✅ Limpieza completa finalizada. Elementos removidos: ${removedCount}`);
    console.log('🔄 Recarga la página para ver los cambios');
    
  } catch (error) {
    console.error('❌ Error durante la limpieza completa:', error);
  }
};

/**
 * Función para ejecutar desde la consola del navegador
 * Expone las funciones de limpieza globalmente para facilitar su uso
 */
export const exposeCleanupFunctions = () => {
  // @ts-ignore
  window.cleanupObsoleteBlobUrls = cleanupObsoleteBlobUrls;
  // @ts-ignore
  window.clearAllChatData = clearAllChatData;
  
  console.log('🔧 Funciones de limpieza disponibles:');
  console.log('   - cleanupObsoleteBlobUrls() - Limpia URLs de blob obsoletas');
  console.log('   - clearAllChatData() - Elimina TODOS los datos de chat');
};

// Auto-exponer las funciones en desarrollo
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  exposeCleanupFunctions();
}