import logging
import re
import httpx
import os
from typing import List, Dict, Any, Optional
from datetime import datetime

# Configuración básica de logging
logger = logging.getLogger(__name__)

# Configuración de Ollama
OLLAMA_API_URL = os.getenv("OLLAMA_API_URL", "http://ollama:11434/api/generate")
SUMMARIZER_MODEL = "gemma3n:e4b"  # Modelo pequeño para resúmenes automáticos

class SummarizerService:
    """
    Servicio de resumen que usa gemma3n:e4b para generar resúmenes inteligentes
    de conversaciones largas, llamando directamente a Ollama.
    """
    
    def __init__(self):
        self.model = SUMMARIZER_MODEL
        self.api_url = OLLAMA_API_URL
    
    async def summarize_conversation(self, messages: List[Dict[str, str]]) -> str:
        """
        Resume una conversación usando el modelo pequeño gemma3n:e4b.
        
        Args:
            messages (List[Dict[str, str]]): Mensajes a resumir
            
        Returns:
            str: Resumen de la conversación
        """
        if not messages:
            return "No hay conversación previa."
        
        # Construir contexto para el resumidor
        conversation_text = ""
        for msg in messages:
            role = msg.get('role', 'unknown')
            content = msg.get('content', '')
            conversation_text += f"[{role.upper()}]: {content}\n\n"
        
        # Prompt especializado para el resumidor
        summarizer_prompt = f"""Eres un resumidor experto especializado en conversaciones de chat. Tu tarea es crear un resumen conciso pero completo que preserve:

1. Puntos clave y temas principales discutidos
2. Contexto importante para la continuidad
3. Tono y estilo de la conversación
4. Información relevante para futuras respuestas

CONVERSACIÓN A RESUMIR:
{conversation_text}

RESUMEN CONCISO:"""
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                payload = {
                    "model": self.model,
                    "prompt": summarizer_prompt,
                    "stream": False,
                    "options": {
                        "temperature": 0.3,  # Más determinístico para resúmenes
                        "top_p": 0.8,
                        "max_tokens": 1000,  # Resúmenes concisos
                        "stop": ["[USER]:", "[ASSISTANT]:"]
                    }
                }
                
                response = await client.post(self.api_url, json=payload)
                response.raise_for_status()
                
                result = response.json()
                summary = result.get('response', '').strip()
                
                if not summary:
                    return f"Resumen de {len(messages)} mensajes de conversación previa."
                
                logger.info(f"Conversación resumida: {len(messages)} mensajes → {len(summary)} caracteres")
                return summary
                
        except Exception as e:
            logger.error(f"Error al resumir conversación: {e}")
            return f"Resumen de {len(messages)} mensajes de conversación previa (error en resumen automático)."

class ContextGenerator:
    """
    Generador de contexto infinito para Gemma 12B.
    Implementa resumen automático con gemma3n:e4b y bloques estructurados.
    Optimizado para el límite de 128k tokens de Gemma 12B.
    
    TODO: OPTIMIZACIÓN CRÍTICA - Cache de Contexto
    - Implementar cache de contexto por chat_id en Redis/PostgreSQL
    - Evitar regenerar contexto en cada request para chats largos
    - Solo regenerar cuando se agreguen nuevos mensajes o se supere límite
    - Estructura sugerida: {chat_id: {context_hash, summary, last_messages, timestamp}}
    - Invalidar cache cuando el chat cambie significativamente
    """
    
    def __init__(self, max_tokens: int = 100000, preserve_recent_messages: int = 10, 
                 summary_target_tokens: int = 20000):
        """
        Inicializa el generador de contexto infinito.
        
        Args:
            max_tokens (int): Límite para activar resumen automático (100k de 128k)
            preserve_recent_messages (int): Mensajes recientes a preservar sin resumir
            summary_target_tokens (int): Tamaño objetivo del resumen
        """
        self.max_tokens = max_tokens
        self.preserve_recent_messages = preserve_recent_messages
        self.summary_target_tokens = summary_target_tokens
        
        # Estimación mejorada: 1 token ≈ 3.5 caracteres para Gemma
        self.chars_per_token = 3.5
        
        # Tokens por imagen (896x896 normalizada)
        self.tokens_per_image = 256
        
        # Inicializar servicio de resumen
        self.summarizer = SummarizerService()
    
    def estimate_token_count(self, text: str) -> int:
        """
        Estima el número de tokens en un texto.
        Usa una aproximación basada en caracteres y palabras.
        
        Args:
            text (str): Texto a analizar
            
        Returns:
            int: Número estimado de tokens
        """
        if not text:
            return 0
        
        # Contar caracteres y palabras
        char_count = len(text)
        word_count = len(text.split())
        
        # Estimación híbrida: promedio entre chars/4 y words*1.3
        char_estimate = char_count / self.chars_per_token
        word_estimate = word_count * 1.3  # Factor para español
        
        return int((char_estimate + word_estimate) / 2)
    
    def calculate_messages_tokens(self, messages: List[Dict[str, str]]) -> int:
        """
        Calcula el total de tokens en una lista de mensajes.
        
        Args:
            messages (List[Dict[str, str]]): Lista de mensajes
            
        Returns:
            int: Total de tokens estimados
        """
        total_tokens = 0
        for message in messages:
            content = message.get('content', '')
            role = message.get('role', '')
            
            # Agregar tokens del rol y formato
            total_tokens += self.estimate_token_count(f"[{role}]: {content}")
            total_tokens += 5  # Overhead por mensaje (formato, separadores)
        
        return total_tokens
    
    def calculate_images_tokens(self, files_data: List[Dict[str, Any]]) -> int:
        """
        Calcula tokens de imágenes (256 tokens por imagen a 896x896).
        
        Args:
            files_data (List[Dict[str, Any]]): Datos de archivos procesados
            
        Returns:
            int: Total de tokens de imágenes
        """
        image_count = 0
        for file_data in files_data:
            if file_data.get('type') == 'image' and file_data.get('processed', False):
                image_count += 1
        
        return image_count * self.tokens_per_image
    
    def calculate_total_context_tokens(self, messages: List[Dict[str, str]], 
                                     files_data: List[Dict[str, Any]]) -> Dict[str, int]:
        """
        Calcula el total de tokens del contexto completo.
        
        Args:
            messages (List[Dict[str, str]]): Mensajes del chat
            files_data (List[Dict[str, Any]]): Datos de archivos
            
        Returns:
            Dict[str, int]: Desglose de tokens por categoría
        """
        messages_tokens = self.calculate_messages_tokens(messages)
        images_tokens = self.calculate_images_tokens(files_data)
        
        # Calcular tokens de archivos no-imagen (transcripciones, PDFs, etc.)
        files_tokens = 0
        for file_data in files_data:
            if file_data.get('type') != 'image' and file_data.get('processed', False):
                if 'transcription' in file_data:
                    files_tokens += self.estimate_token_count(file_data['transcription'])
                elif 'extracted_text' in file_data:
                    files_tokens += self.estimate_token_count(file_data['extracted_text'])
                elif 'text_content' in file_data:
                    files_tokens += self.estimate_token_count(file_data['text_content'])
        
        total_tokens = messages_tokens + images_tokens + files_tokens
        
        return {
            'messages_tokens': messages_tokens,
            'images_tokens': images_tokens,
            'files_tokens': files_tokens,
            'total_tokens': total_tokens
        }
    
    def summarize_old_messages(self, messages: List[Dict[str, str]]) -> str:
        """
        Crea un resumen de mensajes antiguos para reducir tokens.
        
        Args:
            messages (List[Dict[str, str]]): Mensajes a resumir
            
        Returns:
            str: Resumen conciso de los mensajes
        """
        if not messages:
            return ""
        
        user_messages = []
        assistant_messages = []
        
        for msg in messages:
            content = msg.get('content', '').strip()
            if not content:
                continue
                
            if msg.get('role') == 'user':
                user_messages.append(content)
            elif msg.get('role') == 'assistant':
                assistant_messages.append(content)
        
        summary_parts = []
        
        if user_messages:
            # Resumir preguntas/solicitudes del usuario
            user_summary = f"El usuario preguntó sobre: {', '.join(user_messages[:3])}"
            if len(user_messages) > 3:
                user_summary += f" y {len(user_messages) - 3} temas más"
            summary_parts.append(user_summary)
        
        if assistant_messages:
            # Resumir respuestas del asistente
            assistant_summary = f"El asistente respondió sobre: {', '.join([msg[:50] + '...' if len(msg) > 50 else msg for msg in assistant_messages[:2]])}"
            if len(assistant_messages) > 2:
                assistant_summary += f" y {len(assistant_messages) - 2} respuestas más"
            summary_parts.append(assistant_summary)
        
        summary = "[RESUMEN DE CONVERSACIÓN ANTERIOR]\n" + "\n".join(summary_parts)
        
        logger.info(f"Resumidos {len(messages)} mensajes en {len(summary)} caracteres")
        return summary
    
    def apply_sliding_window(self, messages: List[Dict[str, str]]) -> List[Dict[str, str]]:
        """
        Aplica ventana deslizante para mantener el contexto dentro de límites.
        
        Args:
            messages (List[Dict[str, str]]): Lista completa de mensajes
            
        Returns:
            List[Dict[str, str]]: Mensajes optimizados con ventana deslizante
        """
        if not messages:
            return []
        
        # Calcular tokens totales
        total_tokens = self.calculate_messages_tokens(messages)
        
        if total_tokens <= self.max_tokens:
            logger.info(f"Contexto dentro de límites: {total_tokens}/{self.max_tokens} tokens")
            return messages
        
        logger.info(f"Aplicando ventana deslizante: {total_tokens} > {self.max_tokens} tokens")
        
        # Preservar mensajes recientes
        recent_messages = messages[-self.preserve_recent_messages:] if len(messages) > self.preserve_recent_messages else messages
        recent_tokens = self.calculate_messages_tokens(recent_messages)
        
        # Si los mensajes recientes ya exceden el límite, truncar
        if recent_tokens >= self.max_tokens:
            logger.warning(f"Mensajes recientes exceden límite: {recent_tokens} tokens")
            return recent_messages[-3:]  # Mantener solo los últimos 3
        
        # Calcular cuántos tokens quedan para el resumen
        remaining_tokens = self.max_tokens - recent_tokens - 200  # Buffer para resumen
        
        if remaining_tokens > 0 and len(messages) > self.preserve_recent_messages:
            # Crear resumen de mensajes antiguos
            old_messages = messages[:-self.preserve_recent_messages]
            summary = self.summarize_old_messages(old_messages)
            
            # Verificar que el resumen no sea demasiado largo
            summary_tokens = self.estimate_token_count(summary)
            if summary_tokens <= remaining_tokens:
                # Incluir resumen + mensajes recientes
                summary_message = {
                    'role': 'system',
                    'content': summary
                }
                return [summary_message] + recent_messages
        
        # Si no se puede incluir resumen, solo mensajes recientes
        logger.info(f"Usando solo mensajes recientes: {len(recent_messages)} mensajes")
        return recent_messages
    
    async def build_infinite_context(self, messages: List[Dict[str, str]], files_data: List[Dict[str, Any]], 
                                   additional_context: Optional[str] = None, chat_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Construye contexto infinito con resumen automático para Gemma 12B.
        Implementa 4 bloques estructurados: [CONTEXTO RESUMIDO], [ADJUNTOS], [IMÁGENES], [CHAT RECIENTE].
        
        TODO: IMPLEMENTAR CACHE DE CONTEXTO
        - Usar chat_id para cachear contexto generado
        - Verificar si el contexto ya existe en cache (Redis/PostgreSQL)
        - Solo regenerar si hay nuevos mensajes o archivos
        - Implementar hash de mensajes para detectar cambios
        
        Args:
            messages (List[Dict[str, str]]): Mensajes del chat
            files_data (List[Dict[str, Any]]): Datos de archivos procesados
            additional_context (Optional[str]): Contexto adicional opcional
            chat_id (Optional[str]): ID del chat para cache (TODO: implementar)
            
        Returns:
            Dict[str, Any]: Contexto infinito estructurado
        """
        # Calcular tokens totales
        token_breakdown = self.calculate_total_context_tokens(messages, files_data)
        total_tokens = token_breakdown['total_tokens']
        
        logger.info(f"Tokens totales: {total_tokens} (mensajes: {token_breakdown['messages_tokens']}, imágenes: {token_breakdown['images_tokens']}, archivos: {token_breakdown['files_tokens']})")
        
        # Determinar si necesitamos resumen automático
        needs_summary = total_tokens > self.max_tokens
        
        context_blocks = []
        
        # BLOQUE 1: CONTEXTO RESUMIDO (si es necesario)
        if needs_summary and len(messages) > self.preserve_recent_messages:
            logger.info(f"Activando resumen automático: {total_tokens} > {self.max_tokens} tokens")
            
            # Separar mensajes antiguos de recientes
            old_messages = messages[:-self.preserve_recent_messages]
            recent_messages = messages[-self.preserve_recent_messages:]
            
            # Generar resumen con gemma3n:e4b
            summary = await self.summarizer.summarize_conversation(old_messages)
            
            context_blocks.append(f"[CONTEXTO RESUMIDO]\n{summary}")
            
            # Usar solo mensajes recientes para el resto del contexto
            working_messages = recent_messages
            logger.info(f"Resumen generado para {len(old_messages)} mensajes antiguos, preservando {len(recent_messages)} recientes")
        else:
            # No necesitamos resumen, usar todos los mensajes
            working_messages = messages
            logger.info(f"Sin resumen necesario: {total_tokens} <= {self.max_tokens} tokens")
        
        # BLOQUE 2: ADJUNTOS PROCESADOS (transcripciones, PDFs, texto)
        attachments_block = self._build_attachments_block(files_data)
        if attachments_block:
            context_blocks.append(attachments_block)
        
        # BLOQUE 3: IMÁGENES (referencias directas, no base64)
        images_block = self._build_images_block(files_data)
        if images_block:
            context_blocks.append(images_block)
        
        # BLOQUE 4: CHAT RECIENTE + MENSAJE PRINCIPAL
        chat_block = self._build_chat_block(working_messages)
        if chat_block:
            context_blocks.append(chat_block)
        
        # Agregar contexto adicional si existe
        if additional_context:
            context_blocks.insert(0, f"[INSTRUCCIONES SISTEMA]\n{additional_context}")
        
        # Construir contexto final
        final_context = "\n\n".join(context_blocks)
        final_tokens = self.estimate_token_count(final_context) + token_breakdown['images_tokens']
        
        logger.info(f"Contexto infinito generado: {final_tokens} tokens estimados, {len(context_blocks)} bloques")
        
        return {
            'context': final_context,
            'messages_count': len(working_messages),
            'files_count': len(files_data),
            'estimated_tokens': final_tokens,
            'within_limits': final_tokens <= 128000,  # Límite real de Gemma 12B
            'summary_used': needs_summary,
            'blocks_count': len(context_blocks),
            'token_breakdown': token_breakdown,
            'timestamp': datetime.now().isoformat()
        }
    
    def _build_attachments_block(self, files_data: List[Dict[str, Any]]) -> Optional[str]:
        """
        Construye el bloque de adjuntos procesados (no imágenes).
        """
        attachments = []
        
        for file_info in files_data:
            if not file_info.get('processed', False) or file_info.get('type') == 'image':
                continue
                
            filename = file_info.get('filename', 'unknown')
            file_type = file_info.get('type', 'unknown')
            
            if file_type == 'audio' and 'transcription' in file_info:
                attachments.append(f"Audio {filename}:\n{file_info['transcription']}")
            elif file_type == 'pdf' and 'extracted_text' in file_info:
                attachments.append(f"PDF {filename}:\n{file_info['extracted_text']}")
            elif file_type == 'text' and 'text_content' in file_info:
                attachments.append(f"Archivo {filename}:\n{file_info['text_content']}")
            else:
                attachments.append(f"Archivo {filename}: {file_info.get('description', 'Procesado')}")
        
        if not attachments:
            return None
            
        return f"[ADJUNTOS PROCESADOS]\n" + "\n\n".join(attachments)
    
    def _build_images_block(self, files_data: List[Dict[str, Any]]) -> Optional[str]:
        """
        Construye el bloque de imágenes (referencias directas).
        """
        images = []
        
        for file_info in files_data:
            if file_info.get('type') == 'image' and file_info.get('processed', False):
                filename = file_info.get('filename', 'unknown')
                size = file_info.get('size', 0)
                images.append(f"- {filename} ({size} bytes, normalizada a 896x896, 256 tokens)")
        
        if not images:
            return None
            
        return f"[IMÁGENES ADJUNTAS]\nLas siguientes imágenes están disponibles para análisis:\n" + "\n".join(images)
    
    def _build_chat_block(self, messages: List[Dict[str, str]]) -> Optional[str]:
        """
        Construye el bloque de chat reciente.
        """
        if not messages:
            return None
        
        chat_lines = []
        for message in messages:
            role = message.get('role', 'unknown')
            content = message.get('content', '')
            chat_lines.append(f"[{role.upper()}]: {content}")
        
        return f"[CHAT RECIENTE]\n" + "\n\n".join(chat_lines)
    
    def get_context_stats(self, messages: List[Dict[str, str]], files_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Obtiene estadísticas del contexto sin procesarlo.
        
        Args:
            messages (List[Dict[str, str]]): Mensajes del chat
            files_data (List[Dict[str, Any]]): Datos de archivos
            
        Returns:
            Dict[str, Any]: Estadísticas del contexto
        """
        total_tokens = self.calculate_messages_tokens(messages)
        files_tokens = sum(self.estimate_token_count(str(file_data)) for file_data in files_data)
        
        return {
            'total_messages': len(messages),
            'total_files': len(files_data),
            'messages_tokens': total_tokens,
            'files_tokens': files_tokens,
            'total_tokens': total_tokens + files_tokens,
            'max_tokens': self.max_tokens,
            'needs_optimization': (total_tokens + files_tokens) > self.max_tokens,
            'optimization_savings': max(0, (total_tokens + files_tokens) - self.max_tokens)
        }

# Instancia global del generador de contexto infinito
context_generator = ContextGenerator()

# Funciones de conveniencia para usar en agent_service.py
async def generate_infinite_context(messages: List[Dict[str, str]], files_data: List[Dict[str, Any]], 
                                  additional_context: Optional[str] = None) -> Dict[str, Any]:
    """
    Función de conveniencia para generar contexto infinito con resumen automático.
    """
    return await context_generator.build_infinite_context(messages, files_data, additional_context)

def get_context_statistics(messages: List[Dict[str, str]], files_data: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Función de conveniencia para obtener estadísticas del contexto.
    """
    return context_generator.get_context_stats(messages, files_data)

def estimate_tokens(text: str) -> int:
    """
    Función de conveniencia para estimar tokens.
    """
    return context_generator.estimate_token_count(text)

def calculate_total_tokens(messages: List[Dict[str, str]], files_data: List[Dict[str, Any]]) -> Dict[str, int]:
    """
    Función de conveniencia para calcular tokens totales con desglose.
    """
    return context_generator.calculate_total_context_tokens(messages, files_data)