// ResponseDisplay.jsx
import React from "react";
import { Card } from "react-bootstrap";
import ReactMarkdown from "react-markdown";

const ResponseDisplay = ({ response }) => {
  return (
    <Card
      style={{
        backgroundColor: "#e4ade6",
        //background: "linear-gradient(to right, #e4ade6, #784086)", // Gradient from light blue to dark blue
      }}
    >
      <Card.Header
        style={{
          backgroundColor: "#784086",
          color: "#fff",
          fontWeight: "bold",
        }}
      >
        AI Tutor Response
      </Card.Header>
      <Card.Body>
        <Card.Text>
          <ReactMarkdown>
            {response.text}
            {/* Additional formatting can be applied here based on the type of response */}
          </ReactMarkdown>
        </Card.Text>
      </Card.Body>
    </Card>
  );
};

export default ResponseDisplay;
