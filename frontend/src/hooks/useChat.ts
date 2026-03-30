import { useState, useEffect, useCallback } from 'react';
import { api, ChatResponse } from '../lib/api';

/**
 * Hook personalizado para gestionar la lógica del chat
 */
export const useChat = () => {
  // Estado para los mensajes
  const [messages, setMessages] = useState<{ role: 'user' | 'agent', content: string }[]>([]);
  
  // Estado para el ID de sesión
  const [sessionId, setSessionId] = useState<string | undefined>(() => {
    // Intentar recuperar el ID de sesión del almacenamiento local
    const savedSessionId = localStorage.getItem('chat_session_id');
    return savedSessionId || undefined;
  });
  
  // Estado para indicar si se está cargando
  const [isLoading, setIsLoading] = useState(false);
  
  // Estado para errores
  const [error, setError] = useState<string | null>(null);

  // Cargar historial de mensajes al iniciar
  useEffect(() => {
    const loadHistory = async () => {
      if (sessionId) {
        try {
          const history = await api.getHistory(sessionId);
          
          // Convertir el historial a formato de mensajes
          const historyMessages = history.history.flatMap(item => [
            { role: 'user' as const, content: item.user_message },
            { role: 'agent' as const, content: item.agent_response }
          ]);
          
          setMessages(historyMessages);
        } catch (err) {
          console.error('Error al cargar historial:', err);
          // No establecer error para no interrumpir la experiencia del usuario
        }
      }
    };
    
    loadHistory();
  }, [sessionId]);

  // Función para enviar un mensaje
  const sendMessage = useCallback(async (message: string) => {
    if (!message.trim()) return;
    
    // Añadir mensaje del usuario a la lista
    setMessages(prev => [...prev, { role: 'user', content: message }]);
    
    // Indicar que se está cargando
    setIsLoading(true);
    setError(null);
    
    try {
      // Enviar mensaje al backend
      const response: ChatResponse = await api.sendMessage(message, sessionId);
      
      // Guardar el ID de sesión
      if (response.session_id) {
        setSessionId(response.session_id);
        localStorage.setItem('chat_session_id', response.session_id);
      }
      
      // Añadir respuesta del agente a la lista
      setMessages(prev => [...prev, { role: 'agent', content: response.response }]);
    } catch (err) {
      console.error('Error al enviar mensaje:', err);
      setError('Error al comunicarse con el agente. Por favor, inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  // Función para limpiar la conversación
  const clearConversation = useCallback(() => {
    setMessages([]);
    // Generar un nuevo ID de sesión
    const newSessionId = crypto.randomUUID();
    setSessionId(newSessionId);
    localStorage.setItem('chat_session_id', newSessionId);
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearConversation,
    sessionId
  };
};
