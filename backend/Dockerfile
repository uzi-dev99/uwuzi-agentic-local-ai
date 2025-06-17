# Usa una imagen oficial de Python como base.
# 'slim' es una versión ligera, ideal para producción.
FROM python:3.10-slim

# Establece el directorio de trabajo dentro del contenedor.
WORKDIR /backend/files

# Evita que Python escriba archivos .pyc y envía logs directamente a la consola.
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Copia el archivo de dependencias.
COPY requirements.txt .

# Instala las dependencias.
# Se recomienda actualizar pip primero y usar --no-cache-dir para mantener la imagen pequeña.
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copia todo el código de tu backend al directorio de trabajo en el contenedor.
COPY . .

# Expone el puerto 8000 (el que usa uvicorn).
# Esto no lo publica al host, solo lo hace disponible para Docker.
EXPOSE 8000

# El comando para ejecutar tu aplicación cuando el contenedor inicie.
# Escucha en 0.0.0.0 para aceptar conexiones desde fuera del contenedor (dentro de la red Docker).
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]