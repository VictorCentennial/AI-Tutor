import React from "react";
import ResponseDisplay from "./ResponseDisplay";
import { Card } from "react-bootstrap"; // Import Alert from react-bootstrap
import "bootstrap/dist/css/bootstrap.min.css";

function ConversationPanel({ messages }) {
  return (
    <div>
      {messages.map((msg, index) => {
        if (msg.type === "ai") {
          return <ResponseDisplay key={index} response={msg} />;
        } else if (msg.type === "retrievedData") {
          // Display the retrieved data as a card
          return (
            <Card key={index} bg="light" text="dark">
              <Card.Header>Retrieved Data</Card.Header>
              <Card.Body>
                <Card.Text>{msg.text}</Card.Text>
              </Card.Body>
            </Card>
          );
        } else {
          // Just display user queries and errors as text
          return (
            <p
              key={index}
              className={msg.type === "user" ? "user-message" : "error-message"}
            >
              {msg.text}
            </p>
          );
        }
      })}
    </div>
  );
}

export default ConversationPanel;
