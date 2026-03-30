// src/components/Chat.jsx
import React, { useState } from 'react';
import { sendMessage } from '../api/chat';

export default function Chat() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]); // { from: 'user'|'bot', text }

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    // 1. Añadimos el mensaje del usuario al estado
    setMessages(msgs => [...msgs, { from: 'user', text: input }]);

    try {
      // 2. Llamamos a tu backend
      const summary = await sendMessage(input);

      // 3. Añadimos la respuesta del agente
      setMessages(msgs => [...msgs, { from: 'bot', text: summary }]);
    } catch (error) {
      console.error(error);
      setMessages(msgs => [...msgs, { from: 'bot', text: 'Error al comunicarse con el servidor.' }]);
    } finally {
      setInput(''); // limpiamos el input
    }
  };

  return (
    <div className="chat-container">
      <div className="messages">
        {messages.map((m, i) => (
          <div key={i} className={`message ${m.from}`}>
            {m.text}
          </div>
        ))}
      </div>
      <form onSubmit={handleSend} className="input-form">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Escribe tu consulta..."
        />
        <button type="submit">Enviar</button>
      </form>
    </div>
  );
}
