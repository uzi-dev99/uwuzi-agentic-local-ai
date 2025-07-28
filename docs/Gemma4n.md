Genera texto a partir de texto
La forma más sencilla de usar Gemma es solicitarle a un modelo de Gemma que genere una respuesta de texto. Esto funciona con casi todas las variantes de Gemma. En esta sección, se muestra cómo usar la biblioteca de Hugging Face Transformers para cargar y configurar un modelo de Gemma para la generación de texto a texto.

Carga el modelo
Usa las bibliotecas torch y transformers para crear una instancia de una clase pipeline de ejecución del modelo con Gemma. Cuando uses un modelo para generar resultados o seguir instrucciones, selecciona un modelo ajustado para instrucciones (IT), que suele tener it en la cadena de ID del modelo. Con el objeto pipeline, especificas la variante de Gemma que deseas usar, el tipo de tarea que deseas realizar, específicamente "text-generation" para la generación de texto a texto, como se muestra en el siguiente ejemplo de código:


import torch
from transformers import pipeline

pipeline = pipeline(
    task="text-generation",
    model="google/gemma-3-4b-it",
    device=0, # "cuda" for Colab, "msu" for iOS devices
    torch_dtype=torch.bfloat16
)
Gemma solo admite algunos parámetros de configuración de task para la generación. Para obtener más información sobre la configuración de task disponible, consulta la documentación de task() de Hugging Face Pipelines. Usa el tipo de datos de Torch torch.bfloat16 para reducir la precisión del modelo y los recursos de procesamiento necesarios, sin afectar de manera significativa la calidad del resultado del modelo. Para el parámetro de configuración device, puedes usar "cuda" para Colab, "msu" para dispositivos iOS o simplemente establecerlo en 0 (cero) para especificar la primera GPU de tu sistema. Para obtener más información sobre el uso de la clase Pipeline, consulta la documentación de Pipelines de Hugging Face.

Ejecuta la generación de texto
Una vez que hayas cargado y configurado el modelo de Gemma en un objeto pipeline, podrás enviarle instrucciones. En el siguiente ejemplo de código, se muestra una solicitud básica con el parámetro text_inputs:


pipeline(text_inputs="roses are red")

[{'generated_text': 'roses are red, violets are blue, \ni love you more than you ever knew.\n\n**Explanation'}]
Usa una plantilla de instrucción
Cuando generes contenido con instrucciones más complejas, usa una plantilla de instrucción para estructurar tu solicitud. Una plantilla de instrucción te permite especificar la entrada de roles específicos, como user o model, y es un formato obligatorio para administrar interacciones de chat de varios turnos con los modelos de Gemma. En el siguiente ejemplo de código, se muestra cómo construir una plantilla de instrucciones para Gemma:


messages = [
    [
        {
            "role": "system",
            "content": [{"type": "text", "text": "You are a helpful assistant."},]
        },
        {
            "role": "user",
            "content": [{"type": "text", "text": "Roses are red..."},]
        },
    ],
]

pipeline(messages, max_new_tokens=50)

Genera texto a partir de datos de imágenes
A partir de Gemma 3, para tamaños de modelos de 4B y superiores, puedes usar datos de imágenes como parte de tu instrucción. En esta sección, se muestra cómo usar la biblioteca de Transformers para cargar y configurar un modelo de Gemma que use datos de imágenes y texto de entrada para generar texto de salida.

Carga el modelo
Cuando cargas un modelo de Gemma para usarlo con datos de imágenes, configuras la instancia de Transformer pipeline específicamente para usarla con imágenes. En particular, debes seleccionar una configuración de canalización que pueda controlar datos visuales estableciendo el parámetro task en "image-text-to-text", como se muestra en el siguiente ejemplo de código:


import torch
from transformers import pipeline

pipeline = pipeline(
    task="image-text-to-text", # required for image input
    model="google/gemma-3-4b-it",
    device=0,
    torch_dtype=torch.bfloat16
)
Ejecuta la generación de texto
Una vez que hayas configurado el modelo de Gemma para que controle la entrada de imágenes con una instancia de pipeline, puedes enviarle instrucciones con imágenes. Usa el token <start_of_image> para agregar la imagen al texto de tu instrucción. En el siguiente ejemplo de código, se muestra una solicitud básica con el parámetro pipeline:


pipeline(
    "https://ai.google.dev/static/gemma/docs/images/thali-indian-plate.jpg",
    text="<start_of_image> What is shown in this image?"
)

[{'input_text': '<start_of_image> What is shown in this image?',
  'generated_text': '<start_of_image> What is shown in this image?\n\nThis image showcases a traditional Indian Thali. A Thali is a platter that contains a variety'}]
Nota: A partir de la versión 4.53.0 de la biblioteca de Transformers y Gemma 3n, usa <image_soft_token> como marcador de posición para las imágenes en las instrucciones, en lugar de <start_of_image>.
Usa una plantilla de instrucción
Cuando generes contenido con instrucciones más complejas, usa una plantilla de instrucción para estructurar tu solicitud. Una plantilla de instrucción te permite especificar la entrada de roles específicos, como user o model, y es un formato obligatorio para administrar interacciones de chat de varios turnos con los modelos de Gemma. En el siguiente ejemplo de código, se muestra cómo construir una plantilla de instrucciones para Gemma:


messages = [
    {
        "role": "user",
        "content": [
            {"type": "image", "url": "https://ai.google.dev/static/gemma/docs/images/thali-indian-plate.jpg"},
            {"type": "text", "text": "What is shown in this image?"},
        ]
    },
    {
        "role": "assistant",
        "content": [
            {"type": "text", "text": "This image shows"},
        ],
    },
]

pipeline(text=messages, max_new_tokens=50, return_full_text=False)
Puedes incluir varias imágenes en tu instrucción si agregas entradas "type": "image", adicionales a la lista content.

Nota: No uses tokens <start_of_image> o <image_soft_token> en la parte de texto de una plantilla de instrucciones, ya que este enfoque crea tokens redundantes y errores de procesamiento.

Genera texto a partir de datos de audio
Con Gemma 3n, puedes usar datos de audio como parte de tu instrucción. En esta sección, se muestra cómo usar la biblioteca de Transformers para cargar y configurar un modelo de Gemma que use datos de audio y texto de entrada para generar texto de salida.

Instala paquetes de Python
Se requiere una versión reciente de las bibliotecas de Transformers para usar la entrada de audio con Gemma. Instala las bibliotecas de Hugging Face para ejecutar el modelo de Gemma y realizar solicitudes con datos de audio, como se muestra a continuación.


# Install Pytorch & other libraries
%pip install "torch>=2.4.0"

# Install a transformers version that supports Gemma 3n (>= 4.53)
%pip install "transformers>=4.53.0"
Carga el modelo
Cuando cargas un modelo de Gemma para usarlo con datos de audio, configuras la instancia de Transformer específicamente para usarla con datos de audio. En particular, debes definir un objeto processor y model con las clases AutoProcessor y AutoModelForImageTextToText, como se muestra en el siguiente ejemplo de código:


import torch
from transformers import AutoProcessor, AutoModelForImageTextToText

GEMMA_MODEL_ID = "google/gemma-3n-E4B-it"

processor = AutoProcessor.from_pretrained(GEMMA_MODEL_ID, device_map="auto")
model = AutoModelForImageTextToText.from_pretrained(
            GEMMA_MODEL_ID, torch_dtype="auto", device_map="auto")
Usa una plantilla de instrucción
Cuando generes contenido con audio, usa una plantilla de instrucciones para estructurar tu solicitud. Una plantilla de instrucción te permite especificar la entrada de roles específicos, como user o model, y es un formato obligatorio para administrar interacciones de chat de varios turnos con los modelos de Gemma. En el siguiente ejemplo de código, se muestra cómo construir una plantilla de instrucción para Gemma con datos de audio como entrada:


messages = [
    {
        "role": "user",
        "content": [
            {"type": "audio", "audio": "https://ai.google.dev/gemma/docs/audio/roses-are.wav"},
            {"type": "text", "text": "Transcribe this audio and complete the statement"},
        ]
    }
]
Puedes incluir varios archivos de audio en tu instrucción agregando entradas "type": "audio", adicionales a la lista content. Si usas datos de audio en la instrucción, pero no usas una plantilla, usa la sintaxis <audio_soft_token> en el texto de la instrucción.

Nota: No uses tokens <audio_soft_token> en la parte de texto de una plantilla de instrucciones, ya que este enfoque crea tokens redundantes y errores de procesamiento. La biblioteca de Transformers usa <audio_soft_token> como marcador de posición para las imágenes en las instrucciones, en lugar de <start_of_audio>, para mantener la coherencia entre los modelos.
Ejecuta la generación de texto
Una vez que hayas configurado el modelo de Gemma con un objeto processor y model, y hayas creado una instrucción con datos de audio usando una plantilla de instrucción, podrás enviar la instrucción para generar la salida. En el siguiente ejemplo de código, se muestra una solicitud que usa una plantilla de chat, la generación de resultados y la decodificación de la respuesta:


input_ids = processor.apply_chat_template(
        messages,
        add_generation_prompt=True,
        tokenize=True, return_dict=True,
        return_tensors="pt",
)
input_ids = input_ids.to(model.device, dtype=model.dtype)

# Generate output from the model
outputs = model.generate(**input_ids, max_new_tokens=128)

# decode and print the output as text
text = processor.batch_decode(
    outputs,
    skip_special_tokens=False,
    clean_up_tokenization_spaces=False
)
print(text[0])