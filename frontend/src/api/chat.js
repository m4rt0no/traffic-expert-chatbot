// Define endpoint y función para enviar mensajes al backend
export const API_URL = "http://localhost:8000/chat";  // Ajusta si cambia puerto o Host

export async function sendMessage(userInput: string): Promise<string> {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_input: userInput }),
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`API error: ${res.status} ${errorText}`);
  }
  const { response } = await res.json();
  return response;
}