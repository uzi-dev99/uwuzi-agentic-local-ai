from fastapi import FastAPI, File, UploadFile
from faster_whisper import WhisperModel
import os

# 1. Configuraciones "globales"
# Elige tu modelo. "large-v2", "large-v3", "distil-large-v3", etc.
# O un repositorio de HF, p.e. "openai/whisper-large-v2-ct2"
MODEL_NAME = os.environ.get("WHISPER_MODEL", "large-v3")  # puedes setearlo vía variable de entorno
DEVICE = os.environ.get("WHISPER_DEVICE", "cuda")        # "cuda" o "cpu"
COMPUTE_TYPE = os.environ.get("WHISPER_COMPUTE_TYPE", "float16")  # "float16", "int8_float16", etc.

print(f"Loading Faster-Whisper model: {MODEL_NAME} on {DEVICE} with {COMPUTE_TYPE} v2")

model = WhisperModel(MODEL_NAME, device=DEVICE, compute_type=COMPUTE_TYPE)

app = FastAPI()

@app.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    """
    Subir un archivo de audio (multipart/form-data)
    Retorna la transcripción en formato JSON.
    """
    # 2. Guardar temporalmente el archivo
    temp_filename = "temp_audio.mp3"
    with open(temp_filename, "wb") as f:
        f.write(await file.read())

    # 3. Realizar la transcripción
    #    Para audios muy largos, considera "word_timestamps=True" si quieres precisión palabra a palabra
    segments, info = model.transcribe(
        temp_filename,
        beam_size=5,
        language="es",
        task="transcribe",
        temperature=0.0,
        no_speech_threshold=0.5,
        vad_filter=True
    )

    # 4. Construir el texto final
    # Convertir el generador a una lista para poder inspeccionarlo y usarlo
    segment_list = list(segments)

    # DEBUG: Imprimir los segmentos recibidos
    print(f"Whisper lista de segmentos: {segment_list}")

    full_text = ""
    for segment in segment_list:
        full_text += segment.text  # segment.text ya incluye espacios

    # Opcional: Eliminar archivo temporal
    os.remove(temp_filename)

    return {
        "detected_language": info.language,
        "language_probability": info.language_probability,
        "transcription": full_text.strip()
    }
