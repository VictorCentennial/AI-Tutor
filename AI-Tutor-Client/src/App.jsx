// App.jsx
import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import QueryInput from './components/QueryInput';
import ConversationPanel from './components/ConversationPanel';
import axios from 'axios';

function App() {
  const [messages, setMessages] = useState([]);

  const handleQuerySubmit = async (query) => {
    // Append the user's query to the conversation
    setMessages(prev => [...prev, { type: 'user', text: query }]);
  
    try {
      const response = await axios.post('http://localhost:3000/api/initial-query', { prompt: query });
      // Make sure to access the response content correctly based on the actual structure
      const aiTextResponse = response.data.response.kwargs.content;
  
      // Append the AI's response to the conversation
      setMessages(prev => [...prev, { type: 'ai', text: aiTextResponse }]);
    } catch (error) {
      console.error('Error fetching data:', error);
      // Optionally append an error message to the conversation
      setMessages(prev => [...prev, { type: 'error', text: 'Failed to get a response from the AI tutor.' }]);
    }
  };
  
  
  
  

  return (
    <div className="container">
      <h1>AI Tutor</h1>
      <div className="conversation-container">
        {/* Pass messages to ConversationPanel to display them */}
        <ConversationPanel messages={messages} />
      </div>
      <div className="query-input-container">
        {/* The QueryInput stays available for user input */}
        <QueryInput onQuerySubmit={handleQuerySubmit} />
      </div>
    </div>
  );
}

export default App;
