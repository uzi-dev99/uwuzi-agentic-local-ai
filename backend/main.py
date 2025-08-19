from fastapi import FastAPI, HTTPException, Request, UploadFile, File, Form
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Dict, Optional
from fastapi.middleware.cors import CORSMiddleware
import logging
import json

# Importar servicios
from services.chat_service import generate_response
from services.n8n_service import invoke_workflow, invoke_workflow_multipart

# Setup basic logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="uWuzi-Assist Backend",
    description="API for uWuzi-Assist application, providing chat functionalities with Ollama.",
    version="0.2.3"
)

# --- CORS Middleware ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permitir todos los orígenes
    allow_credentials=True,
    allow_methods=["*"],  # Permitir todos los métodos
    allow_headers=["*"],  # Permitir todas las cabeceras
)
# --- FIN CORS ---

# Setup basic logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --- Pydantic Models ---
class ChatRequest(BaseModel):
    messages: List[Dict[str, str]]


# --- Endpoints ---

@app.post("/api/v1/chat/direct")
async def direct_chat_endpoint(request: Request):
    """
    Endpoint para comunicación directa con el modelo multimodal.
    Recibe el historial de chat y opcionalmente archivos adjuntos.
    Maneja tanto 'application/json' como 'multipart/form-data'.
    """
    try:
        content_type = request.headers.get('content-type', '')
        
        if 'multipart/form-data' in content_type:
            form = await request.form()
            messages_str = form.get('messages')
            if not messages_str:
                raise HTTPException(status_code=400, detail="'messages' field is required in form data.")
            messages_list = json.loads(messages_str)
            files = form.getlist('files')
        elif 'application/json' in content_type:
            data = await request.json()
            messages_list = data.get('messages')
            if not messages_list:
                raise HTTPException(status_code=400, detail="'messages' field is required in JSON body.")
            files = None # No files in JSON mode
        else:
            raise HTTPException(status_code=415, detail=f"Unsupported media type: {content_type}")

        logger.info(f"Received direct chat request with {len(messages_list)} messages.")
        response_data = await generate_response(messages=messages_list, files=files)
        return JSONResponse(content=response_data)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON format for messages.")
    except Exception as e:
        logger.error(f"Error in direct_chat_endpoint: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/agent/invoke")
async def agent_invoke(request: Request):
    """
    Invoca el workflow de n8n para el modo agente.
    Recibe el payload del frontend y lo reenvía al webhook de n8n.
    Devuelve un JSON normalizado con la clave 'content' para facilitar el consumo en el frontend.
    Soporta 'application/json' y 'multipart/form-data' con archivos arbitrarios (imagenes base64, audio mp3, pdf, etc.).
    """
    try:
        content_type = request.headers.get('content-type', '')

        if 'multipart/form-data' in content_type:
            form = await request.form()
            # Passthrough: reenviar todos los campos de texto y los archivos
            form_fields: Dict[str, str] = {}
            files = []
            for key, value in form.multi_items():
                if hasattr(value, 'filename'):
                    # Es un archivo
                    files.append(value)
                else:
                    form_fields[str(key)] = str(value)

            logger.info(f"Invoking n8n multipart with {len(form_fields)} fields and {len(files)} files")
            response_data = await invoke_workflow_multipart(form_fields, files)  # type: ignore[arg-type]
        elif 'application/json' in content_type:
            data = await request.json()
            payload = data if isinstance(data, dict) else {}
            logger.info(f"Invoking n8n JSON with payload keys: {list(payload.keys())}")
            response_data = await invoke_workflow(payload)
        else:
            raise HTTPException(status_code=415, detail=f"Unsupported media type: {content_type}")

        # Normalizar salida
        if isinstance(response_data, dict) and isinstance(response_data.get('content'), str):
            normalized = response_data
        else:
            normalized = {"content": json.dumps(response_data, ensure_ascii=False)}

        return JSONResponse(content=normalized)
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error in agent_invoke: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/")
async def read_root():
    return {"message": "Welcome to uWuzi-Assist Backend. Use /docs for API documentation."}

# If running directly (e.g. uvicorn main:app --reload)
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
