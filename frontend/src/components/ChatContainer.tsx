import React, { useState, useRef, useEffect } from 'react';

interface ChatMessageProps {
  role: 'user' | 'agent';
  content: string;
}

/**
 * Componente para mostrar un mensaje individual en el chat
 */
const ChatMessage: React.FC<ChatMessageProps> = ({ role, content }) => {
  // Determinar la alineación y estilo según el rol
  const isUser = role === 'user';
  
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div 
        className={`max-w-[80%] rounded-lg px-4 py-2 ${
          isUser 
            ? 'bg-blue-500 text-white rounded-tr-none' 
            : 'bg-gray-200 text-gray-800 rounded-tl-none'
        }`}
      >
        {/* Formatear el contenido con saltos de línea */}
        {content.split('\n').map((line, i) => (
          <React.Fragment key={i}>
            {line}
            {i < content.split('\n').length - 1 && <br />}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
}

/**
 * Componente para la entrada de texto del chat
 */
const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading }) => {
  const [message, setMessage] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Manejar el envío del mensaje
  const handleSendMessage = () => {
    if (message.trim() && !isLoading) {
      onSendMessage(message);
      setMessage('');
    }
  };

  // Manejar la tecla Enter para enviar el mensaje
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Ajustar automáticamente la altura del textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
    }
  }, [message]);

  return (
    <div className="border-t border-gray-300 p-4 bg-white">
      <div className="flex items-end">
        <textarea
          ref={inputRef}
          className="flex-grow border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none min-h-[40px] max-h-[120px]"
          placeholder="Escribe un mensaje..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          rows={1}
        />
        <button
          className={`ml-2 px-4 py-2 rounded-lg ${
            isLoading || !message.trim()
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-blue-500 hover:bg-blue-600 text-white'
          }`}
          onClick={handleSendMessage}
          disabled={isLoading || !message.trim()}
        >
          {isLoading ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Enviando
            </span>
          ) : (
            'Enviar'
          )}
        </button>
      </div>
    </div>
  );
};

interface ChatContainerProps {
  messages: { role: 'user' | 'agent'; content: string }[];
  isLoading: boolean;
  error: string | null;
  onSendMessage: (message: string) => void;
  onClearConversation: () => void;
}

/**
 * Componente principal del contenedor de chat
 */
const ChatContainer: React.FC<ChatContainerProps> = ({
  messages,
  isLoading,
  error,
  onSendMessage,
  onClearConversation,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Desplazarse al final de los mensajes cuando se añaden nuevos
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  return (
    <div className="flex flex-col h-full bg-gray-50 rounded-lg shadow-lg overflow-hidden">
      {/* Encabezado del chat */}
      <div className="bg-blue-600 text-white p-4 flex justify-between items-center">
        <h2 className="text-xl font-semibold">Agente de Optimización de Tráfico</h2>
        <button
          className="px-3 py-1 bg-blue-700 hover:bg-blue-800 rounded-lg text-sm"
          onClick={onClearConversation}
        >
          Nueva conversación
        </button>
      </div>
      
      {/* Área de mensajes */}
      <div className="flex-grow p-4 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="text-center">
              Envía un mensaje para comenzar la conversación con el agente de optimización de tráfico.
            </p>
            <div className="mt-4 p-3 bg-blue-100 rounded-lg text-sm text-blue-800 max-w-md">
              <p className="font-semibold mb-2">Ejemplos de consultas:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>"Quiero dar alta prioridad al transporte público y baja prioridad a las emisiones"</li>
                <li>"Optimiza el transporte público a 0.7, congestión a 0.2, emisiones a 0.05 y costo operacional a 0.05"</li>
                <li>"Realiza una optimización dinámica con alta prioridad para el transporte público"</li>
              </ul>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message, index) => (
              <ChatMessage key={index} role={message.role} content={message.content} />
            ))}
            {isLoading && (
              <div className="flex justify-start mb-4">
                <div className="bg-gray-200 text-gray-800 rounded-lg rounded-tl-none px-4 py-2">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 rounded-full bg-gray-600 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 rounded-full bg-gray-600 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 rounded-full bg-gray-600 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}
            {error && (
              <div className="flex justify-center mb-4">
                <div className="bg-red-100 text-red-800 rounded-lg px-4 py-2 max-w-[80%]">
                  <p className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {error}
                  </p>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>
      
      {/* Entrada de texto */}
      <ChatInput onSendMessage={onSendMessage} isLoading={isLoading} />
    </div>
  );
};

export default ChatContainer;
