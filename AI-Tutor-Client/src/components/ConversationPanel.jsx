import React from 'react';
import ResponseDisplay from './ResponseDisplay';

function ConversationPanel({ messages }) {
  return (
    <div>
      {messages.map((msg, index) => {
        if (msg.type === 'ai') {
          return <ResponseDisplay key={index} response={msg} />;
        } else {
          // Just display user queries and errors as text
          return <p key={index} className={msg.type === 'user' ? 'user-message' : 'error-message'}>{msg.text}</p>;
        }
      })}
    </div>
  );
}

export default ConversationPanel;
