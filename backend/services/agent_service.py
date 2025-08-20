import logging
from typing import List, Dict, Any
from fastapi import UploadFile
from .n8n_service import invoke_workflow, invoke_workflow_multipart
from .file_router_service import route_and_process_files, get_file_processing_summary
from .context_generator_service import generate_infinite_context, get_context_statistics, calculate_total_tokens

# Configuración básica de logging
logger = logging.getLogger(__name__)

async def orchestrate_agent_response(messages: List[Dict[str, str]], files: List[UploadFile]) -> Dict[str, Any]:
    """
    Orquesta la respuesta del agente procesando archivos, generando contexto y enviando a N8N.
    Implementa el flujo completo: Enrutador → Generador Contexto → N8N.
    
    TODO: OPTIMIZACIÓN DE RENDIMIENTO
    - Implementar chat_id para identificar conversaciones únicas
    - Usar cache de contexto para evitar regeneración innecesaria
    - Implementar rate limiting por chat_id
    - Agregar métricas de rendimiento (tiempo de procesamiento, tokens/segundo)
    
    Args:
        messages (List[Dict[str, str]]): Mensajes del chat
        files (List[UploadFile]): Archivos adjuntos
        
    Returns:
        Dict[str, Any]: Respuesta del agente o error
    """
    logger.info(f"Orchestrator received {len(messages)} messages and {len(files)} files.")

    try:
        # FASE 2: Enrutador de archivos - Procesar archivos según su tipo
        processed_files = []
        if files:
            logger.info(f"Processing {len(files)} files through file router")
            processed_files = await route_and_process_files(files)
            logger.info(f"File processing completed: {len(processed_files)} files processed")
        
        # FASE 3: Generador de contexto infinito - Resumen automático con gemma3n:e4b
        logger.info(f"Generating infinite context for {len(messages)} messages and {len(processed_files)} files")
        
        # Obtener estadísticas del contexto antes de procesar
        token_breakdown = calculate_total_tokens(messages, processed_files)
        logger.info(f"Token breakdown: {token_breakdown['total_tokens']} total (mensajes: {token_breakdown['messages_tokens']}, imágenes: {token_breakdown['images_tokens']}, archivos: {token_breakdown['files_tokens']})")
        
        # Generar contexto infinito con resumen automático
        # TODO: Extraer chat_id del request o generar uno basado en hash de mensajes
        # TODO: Implementar cache lookup antes de generar contexto
        additional_context = "Eres Wuzi, un asistente AI multimodal inteligente. Analiza el contexto completo incluyendo mensajes, archivos adjuntos e imágenes para proporcionar respuestas útiles, precisas y contextualmente apropiadas."
        infinite_context = await generate_infinite_context(messages, processed_files, additional_context)
        # TODO: Guardar contexto generado en cache con TTL apropiado
        
        logger.info(f"Infinite context generated: {infinite_context['estimated_tokens']} tokens, {infinite_context['blocks_count']} bloques, resumen usado: {infinite_context['summary_used']}")
        
        # Preparar datos para N8N con contexto infinito
        context_data = {
            "mode": "agent",
            "context": infinite_context['context'],
            "messages_count": infinite_context['messages_count'],
            "files_count": infinite_context['files_count'],
            "estimated_tokens": infinite_context['estimated_tokens'],
            "within_limits": infinite_context['within_limits'],
            "summary_used": infinite_context['summary_used'],
            "blocks_count": infinite_context['blocks_count'],
            "timestamp": infinite_context['timestamp'],
            "original_messages": len(messages),
            "token_breakdown": infinite_context['token_breakdown'],
            "files_summary": get_file_processing_summary(processed_files) if processed_files else "No hay archivos adjuntos."
        }
        
        # Enviar a N8N con contexto optimizado
        if files:
            # Usar multipart si hay archivos (mantener archivos originales para N8N)
            form_fields = {
                "context": infinite_context['context'],
                "messages_count": str(infinite_context['messages_count']),
                "files_count": str(len(processed_files)),
                "estimated_tokens": str(infinite_context['estimated_tokens']),
                "summary_used": str(infinite_context['summary_used']),
                "blocks_count": str(infinite_context['blocks_count']),
                "files_summary": context_data["files_summary"]
            }
            response = await invoke_workflow_multipart(form_fields, files)
        else:
            # Usar JSON si solo hay mensajes
            response = await invoke_workflow(context_data)
        
        # Normalizar respuesta para asegurar que tenga 'content'
        if isinstance(response, dict) and "content" in response:
            return response
        else:
            return {
                "content": f"Agente procesó {len(messages)} mensajes y {len(files)} archivos. Respuesta: {str(response)}"
            }
            
    except Exception as e:
        logger.error(f"Error in agent orchestration: {e}", exc_info=True)
        return {
            "content": f"Error en el agente: {str(e)}. Por favor, intenta de nuevo o cambia a modo chat."
        }