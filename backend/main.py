from fastapi import FastAPI, HTTPException, Request, UploadFile, File, Form
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Dict, Optional
from fastapi.middleware.cors import CORSMiddleware
import logging
import json

# Importar servicios
from services.chat_service import generate_response
from services.n8n_service import invoke_workflow

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
async def agent_invoke(request: "AgentInvokeRequest"):
    """
    Invokes the n8n workflow for the agent mode.
    Receives the user's message and forwards it to the n8n webhook.
    """
    try:
        # The request object is already validated by Pydantic
        # Now, we pass the data to our n8n service
        payload = request.dict()
        logger.info(f"Invoking agent workflow with payload: {payload}")
        response_data = await invoke_workflow(payload)
        return response_data
    except HTTPException as e:
        # Forward HTTP exceptions from the service
        raise e
    except Exception as e:
        # Handle other potential errors
        logger.error(f"Error in agent_invoke: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/")
async def read_root():
    return {"message": "Welcome to uWuzi-Assist Backend. Use /docs for API documentation."}

# If running directly (e.g. uvicorn main:app --reload)
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
