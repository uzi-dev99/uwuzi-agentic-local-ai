import unittest
import httpx
import asyncio
import json

class TestChatDirect(unittest.TestCase):

    def test_chat_direct_text_only(self):
        """
        Prueba el endpoint /api/v1/chat/direct enviando solo un mensaje de texto.
        """
        async def run_test():
            print("--- Iniciando prueba: Solo Texto ---")
            
            # Define la URL del endpoint
            url = "https://backend-nodo-uno.wuzi.uk/api/v1/chat/direct"
            
            # Define el historial de mensajes (puede estar vacío o tener mensajes previos)
            messages = [
                {"role": "user", "content": "Hola, ¿quién eres?"}
            ]
            
            # Crea el payload de la solicitud
            payload = {
                "messages": json.dumps(messages) # Asegúrate de que los mensajes estén como una cadena JSON
            }
            
            # Define los encabezados, incluyendo la clave de API
            headers = {
                "Authorization": "Bearer PpKb86bkIfszCuNrMMK62yDfgT6hsYRB"
            }
            
            try:
                async with httpx.AsyncClient(timeout=120.0) as client:
                    async with client.stream("POST", url, data=payload, headers=headers) as response:
                        print(f"Código de estado de la respuesta: {response.status_code}")
                        # Verifica que la solicitud fue exitosa
                        self.assertEqual(response.status_code, 200)
                        
                        print("Conexión exitosa. Recibiendo respuesta en streaming...")
                        content_received = False
                        # Itera sobre los chunks de la respuesta y los imprime para depuración
                        async for chunk in response.aiter_bytes():
                            content_received = True
                            print(f"Chunk recibido: {chunk.decode('utf-8')}")
                        
                        self.assertTrue(content_received, "No se recibió contenido en el stream.")
                        print("\n--- Prueba finalizada ---")

            except httpx.ConnectError as e:
                self.fail(f"Error de conexión: No se pudo conectar a {url}. ¿Está el servidor corriendo?\n{e}")
            except Exception as e:
                self.fail(f"Ocurrió un error inesperado: {e}")

        asyncio.run(run_test())

if __name__ == '__main__':
    unittest.main()