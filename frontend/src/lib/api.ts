/**
 * Cliente API para comunicarse con el backend FastAPI
 */

// Base URL: toma de VITE_API_URL o fallback a localhost
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/**
 * Interfaz de respuesta del chat (coincide con { response: string })
 */
export interface ChatResponse {
  response: string;
  session_id?: string;
}

/**
 * Envía un mensaje al agente de tráfico
 */
export const api = {
  async sendMessage(
    message: string,
    session_id?: string
  ): Promise<ChatResponse> {
    const payload: Record<string, any> = { user_input: message };
    if (session_id) payload.session_id = session_id;

    const res = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Error ${res.status}: ${txt}`);
    }

    // FastAPI devuelve { response }
    const data = await res.json();
    return { response: data.response, session_id: data.get('session_id') };
  },

  async health(): Promise<{ status: string }> {
    const res = await fetch(`${API_BASE_URL}/health`);
    if (!res.ok) throw new Error(`Health check failed: ${res.status}`);
    return res.json();
  },
};