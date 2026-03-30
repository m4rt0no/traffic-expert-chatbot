import { useChat } from './hooks/useChat';
import ChatContainer from './components/ChatContainer';
import './App.css';

function App() {
  const { messages, isLoading, error, sendMessage, clearConversation } = useChat();

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <header className="bg-white shadow-sm p-4">
        <div className="container mx-auto">
          <h1 className="text-2xl font-bold text-gray-800">Agente de Optimización de Tráfico</h1>
        </div>
      </header>
      
      <main className="flex-grow container mx-auto p-4 flex flex-col">
        <div className="flex-grow flex flex-col h-[calc(100vh-8rem)]">
          <ChatContainer
            messages={messages}
            isLoading={isLoading}
            error={error}
            onSendMessage={sendMessage}
            onClearConversation={clearConversation}
          />
        </div>
      </main>
      
      <footer className="bg-white border-t border-gray-200 p-4">
        <div className="container mx-auto text-center text-gray-500 text-sm">
          &copy; {new Date().getFullYear()} Agente de Optimización de Tráfico - Desarrollado con React y Flask
        </div>
      </footer>
    </div>
  );
}

export default App;
