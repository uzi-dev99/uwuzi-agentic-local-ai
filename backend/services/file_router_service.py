import logging
import base64
import mimetypes
from typing import Dict, List, Any, Optional
from fastapi import UploadFile
from .audio_service import transcribe_audio
import PyPDF2
import io

# Configuración básica de logging
logger = logging.getLogger(__name__)

class FileRouter:
    """
    Enrutador de archivos que clasifica y procesa archivos según su tipo.
    Parte de la FASE 2 del roadmap MVP final.
    """
    
    def __init__(self):
        self.supported_image_types = {
            'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 
            'image/webp', 'image/bmp', 'image/tiff'
        }
        self.supported_audio_types = {
            'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 
            'audio/m4a', 'audio/aac', 'audio/flac'
        }
        self.supported_text_types = {
            'text/plain', 'text/markdown', 'text/csv', 
            'application/json', 'text/html'
        }
        self.supported_pdf_types = {
            'application/pdf'
        }
    
    async def classify_file_type(self, file: UploadFile) -> str:
        """
        Clasifica un archivo según su tipo MIME.
        
        Args:
            file (UploadFile): Archivo a clasificar
            
        Returns:
            str: Tipo clasificado ('image', 'audio', 'text', 'pdf', 'pdf-small', 'pdf-large', 'other')
        """
        content_type = file.content_type or 'application/octet-stream'
        
        # Leer el contenido para obtener el tamaño real
        content = await file.read()
        file_size = len(content)
        await file.seek(0)  # Resetear el puntero para futuras lecturas

        logger.info(f"📁 Classifying file: {file.filename} - Type: {content_type} - Size: {file_size}")
        
        if content_type in self.supported_image_types:
            return 'image'
        elif content_type in self.supported_audio_types:
            return 'audio'
        elif content_type in self.supported_text_types:
            return 'text'
        elif content_type in self.supported_pdf_types:
            if file_size < 1024 * 1024:  # <1MB
                logger.info(f"📄 Small PDF detected: {file.filename} ({file_size} bytes)")
                return 'pdf-small'
            else:
                logger.info(f"📄 Large PDF detected: {file.filename} ({file_size} bytes)")
                return 'pdf-large'
        else:
            logger.info(f"❓ Unknown file type: {content_type}")
            return 'other'
    
    async def process_image_file(self, file: UploadFile) -> Dict[str, Any]:
        """
        Procesa un archivo de imagen obteniendo metadatos (sin conversión a base64).
        Las imágenes se envían directamente a Gemma 12B que las normaliza a 896x896 (256 tokens).
        
        Args:
            file (UploadFile): Archivo de imagen
            
        Returns:
            Dict[str, Any]: Metadatos de la imagen
        """
        try:
            content = await file.read()
            # Resetear posición para que N8N pueda leer el archivo
            await file.seek(0)
            
            return {
                'type': 'image',
                'filename': file.filename or 'unknown.jpg',
                'content_type': file.content_type,
                'size': len(content),
                'tokens_count': 256,  # Gemma normaliza a 896x896 = 256 tokens
                'processed': True,
                'description': f"Imagen {file.filename} ({len(content)} bytes, 256 tokens)",
                'note': "Imagen enviada directamente a Gemma 12B sin conversión base64"
            }
        except Exception as e:
            logger.error(f"Error processing image file {file.filename}: {e}")
            return {
                'type': 'image',
                'filename': file.filename or 'unknown.jpg',
                'error': str(e),
                'processed': False
            }
    
    async def process_audio_file(self, file: UploadFile) -> Dict[str, Any]:
        """
        Procesa un archivo de audio enviándolo a transcripción.
        
        Args:
            file (UploadFile): Archivo de audio
            
        Returns:
            Dict[str, Any]: Datos procesados del audio
        """
        try:
            # Resetear posición del archivo
            await file.seek(0)
            
            # Transcribir usando el servicio de audio existente
            transcription = await transcribe_audio(file)
            
            return {
                'type': 'audio',
                'filename': file.filename or 'unknown.mp3',
                'content_type': file.content_type,
                'transcription': transcription,
                'processed': True,
                'description': f"Audio {file.filename} transcrito: {transcription[:100]}..."
            }
        except Exception as e:
            logger.error(f"Error processing audio file {file.filename}: {e}")
            return {
                'type': 'audio',
                'filename': file.filename or 'unknown.mp3',
                'error': str(e),
                'processed': False
            }
    
    async def process_pdf_file(self, file: UploadFile) -> Dict[str, Any]:
        """
        Procesa un archivo PDF extrayendo su texto.
        
        Args:
            file (UploadFile): Archivo PDF
            
        Returns:
            Dict[str, Any]: Datos procesados del PDF
        """
        try:
            content = await file.read()
            await file.seek(0)
            pdf_file = io.BytesIO(content)
            
            # Usar PyPDF2 para extraer texto
            pdf_reader = PyPDF2.PdfReader(pdf_file)
            extracted_text = ""
            
            for page_num in range(len(pdf_reader.pages)):
                page = pdf_reader.pages[page_num]
                extracted_text += page.extract_text() + "\n"
            
            return {
                'type': 'pdf',
                'filename': file.filename or 'unknown.pdf',
                'content_type': file.content_type,
                'size': len(content),
                'pages': len(pdf_reader.pages),
                'extracted_text': extracted_text.strip(),
                'processed': True,
                'description': f"PDF {file.filename} ({len(pdf_reader.pages)} páginas, {len(extracted_text)} caracteres)"
            }
        except Exception as e:
            logger.error(f"Error processing PDF file {file.filename}: {e}")
            return {
                'type': 'pdf',
                'filename': file.filename or 'unknown.pdf',
                'error': str(e),
                'processed': False
            }
    
    async def process_pdf_small_file(self, file: UploadFile) -> Dict[str, Any]:
        """
        Procesa un PDF pequeño (<1MB) - candidato para conversión a imagen.
        
        Args:
            file (UploadFile): Archivo PDF pequeño
            
        Returns:
            Dict[str, Any]: Datos procesados del PDF pequeño
        """
        try:
            content = await file.read()
            await file.seek(0)
            pdf_file = io.BytesIO(content)
            
            # Usar PyPDF2 para extraer texto
            pdf_reader = PyPDF2.PdfReader(pdf_file)
            extracted_text = ""
            
            for page_num in range(len(pdf_reader.pages)):
                page = pdf_reader.pages[page_num]
                extracted_text += page.extract_text() + "\n"
            
            # TODO: Implementar conversión a imagen para PDFs pequeños
            # Por ahora, extraemos texto como los PDFs normales
            
            return {
                'type': 'pdf-small',
                'filename': file.filename or 'unknown.pdf',
                'content_type': file.content_type,
                'size': len(content),
                'pages': len(pdf_reader.pages),
                'extracted_text': extracted_text.strip(),
                'processed': True,
                'conversion_candidate': True,  # Marca para futura conversión a imagen
                'description': f"PDF pequeño {file.filename} ({len(pdf_reader.pages)} páginas, candidato para conversión a imagen)"
            }
        except Exception as e:
            logger.error(f"Error processing small PDF file {file.filename}: {e}")
            return {
                'type': 'pdf-small',
                'filename': file.filename or 'unknown.pdf',
                'error': str(e),
                'processed': False
            }
    
    async def process_pdf_large_file(self, file: UploadFile) -> Dict[str, Any]:
        """
        Procesa un PDF grande (>1MB) - solo extracción de texto.
        
        Args:
            file (UploadFile): Archivo PDF grande
            
        Returns:
            Dict[str, Any]: Datos procesados del PDF grande
        """
        try:
            content = await file.read()
            await file.seek(0)
            pdf_file = io.BytesIO(content)
            
            # Usar PyPDF2 para extraer texto
            pdf_reader = PyPDF2.PdfReader(pdf_file)
            extracted_text = ""
            
            for page_num in range(len(pdf_reader.pages)):
                page = pdf_reader.pages[page_num]
                extracted_text += page.extract_text() + "\n"
            
            return {
                'type': 'pdf-large',
                'filename': file.filename or 'unknown.pdf',
                'content_type': file.content_type,
                'size': len(content),
                'pages': len(pdf_reader.pages),
                'extracted_text': extracted_text.strip(),
                'processed': True,
                'text_only': True,  # Marca que solo se extrajo texto
                'description': f"PDF grande {file.filename} ({len(pdf_reader.pages)} páginas, {len(extracted_text)} caracteres extraídos)"
            }
        except Exception as e:
            logger.error(f"Error processing large PDF file {file.filename}: {e}")
            return {
                'type': 'pdf-large',
                'filename': file.filename or 'unknown.pdf',
                'error': str(e),
                'processed': False
            }
    
    async def process_text_file(self, file: UploadFile) -> Dict[str, Any]:
        """
        Procesa un archivo de texto leyendo su contenido.
        
        Args:
            file (UploadFile): Archivo de texto
            
        Returns:
            Dict[str, Any]: Datos procesados del texto
        """
        try:
            content = await file.read()
            text_content = content.decode('utf-8')
            
            return {
                'type': 'text',
                'filename': file.filename or 'unknown.txt',
                'content_type': file.content_type,
                'size': len(content),
                'text_content': text_content,
                'processed': True,
                'description': f"Archivo de texto {file.filename} ({len(text_content)} caracteres)"
            }
        except UnicodeDecodeError:
            # Intentar con diferentes encodings
            try:
                await file.seek(0)
                content = await file.read()
                text_content = content.decode('latin-1')
                
                return {
                    'type': 'text',
                    'filename': file.filename or 'unknown.txt',
                    'content_type': file.content_type,
                    'size': len(content),
                    'text_content': text_content,
                    'processed': True,
                    'encoding': 'latin-1',
                    'description': f"Archivo de texto {file.filename} ({len(text_content)} caracteres, encoding: latin-1)"
                }
            except Exception as e:
                logger.error(f"Error processing text file {file.filename}: {e}")
                return {
                    'type': 'text',
                    'filename': file.filename or 'unknown.txt',
                    'error': str(e),
                    'processed': False
                }
        except Exception as e:
            logger.error(f"Error processing text file {file.filename}: {e}")
            return {
                'type': 'text',
                'filename': file.filename or 'unknown.txt',
                'error': str(e),
                'processed': False
            }
    
    async def process_other_file(self, file: UploadFile) -> Dict[str, Any]:
        """
        Procesa archivos de tipo desconocido obteniendo metadatos básicos.
        
        Args:
            file (UploadFile): Archivo de tipo desconocido
            
        Returns:
            Dict[str, Any]: Metadatos básicos del archivo
        """
        try:
            content = await file.read()
            
            return {
                'type': 'other',
                'filename': file.filename or 'unknown',
                'content_type': file.content_type or 'application/octet-stream',
                'size': len(content),
                'processed': True,
                'description': f"Archivo {file.filename} ({file.content_type}, {len(content)} bytes)"
            }
        except Exception as e:
            logger.error(f"Error processing other file {file.filename}: {e}")
            return {
                'type': 'other',
                'filename': file.filename or 'unknown',
                'error': str(e),
                'processed': False
            }
    
    async def route_and_process_files(self, files: List[UploadFile]) -> List[Dict[str, Any]]:
        """
        Función principal que enruta y procesa una lista de archivos.
        
        Args:
            files (List[UploadFile]): Lista de archivos a procesar
            
        Returns:
            List[Dict[str, Any]]: Lista de archivos procesados
        """
        processed_files = []
        
        for file in files:
            logger.info(f"Processing file: {file.filename} ({file.content_type})")
            
            file_type = await self.classify_file_type(file)
            
            if file_type == 'image':
                result = await self.process_image_file(file)
            elif file_type == 'audio':
                result = await self.process_audio_file(file)
            elif file_type == 'pdf':
                result = await self.process_pdf_file(file)
            elif file_type == 'pdf-small':
                result = await self.process_pdf_small_file(file)
            elif file_type == 'pdf-large':
                result = await self.process_pdf_large_file(file)
            elif file_type == 'text':
                result = await self.process_text_file(file)
            else:
                result = await self.process_other_file(file)
            
            processed_files.append(result)
            logger.info(f"File {file.filename} processed: {result.get('processed', False)}")
        
        return processed_files

# Instancia global del enrutador
file_router = FileRouter()

# Funciones de conveniencia para usar en agent_service.py
async def route_and_process_files(files: List[UploadFile]) -> List[Dict[str, Any]]:
    """
    Función de conveniencia para enrutar y procesar archivos.
    """
    return await file_router.route_and_process_files(files)

def get_file_processing_summary(processed_files: List[Dict[str, Any]]) -> str:
    """
    Genera un resumen de los archivos procesados para incluir en el contexto.
    
    Args:
        processed_files (List[Dict[str, Any]]): Lista de archivos procesados
        
    Returns:
        str: Resumen de archivos procesados
    """
    if not processed_files:
        return "No se procesaron archivos."
    
    summary_parts = []
    for file_data in processed_files:
        if file_data.get('processed', False):
            summary_parts.append(file_data.get('description', f"Archivo {file_data.get('filename', 'unknown')}"))
        else:
            summary_parts.append(f"Error procesando {file_data.get('filename', 'unknown')}: {file_data.get('error', 'Error desconocido')}")
    
    return "\n".join(summary_parts)