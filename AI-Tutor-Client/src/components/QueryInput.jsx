// QueryInput.jsx
import React, { useState } from "react";
import { Form, Button } from "react-bootstrap";

function QueryInput({ onSubmit }) {
  const [query, setQuery] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      // const response = await axios.post('http://localhost:3000/api/initial-query', { prompt: query });
      // console.log("Server Response:", response.data);
      // onQuerySubmit(query, response.data); // Pass the response data up to the App component
      await onSubmit(query);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
    setQuery("");
  };

  const handleKeyPress = (event) => {
    if (event.key === "Enter") {
      handleSubmit(event);
    }
  };

  return (
    <Form onSubmit={handleSubmit}>
      <Form.Group className="mb-3">
        <Form.Label>Ask a question:</Form.Label>
        <Form.Control
          as="textarea"
          rows={10}
          cols={50} // Set the number of columns to 20
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter your question"
          onKeyDown={handleKeyPress}
        />
      </Form.Group>
      <Button variant="primary" type="submit">
        Submit
      </Button>
    </Form>
  );
}

export default QueryInput;
