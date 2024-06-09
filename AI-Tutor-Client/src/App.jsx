// App.jsx
import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import QueryInput from "./components/QueryInput";
import ConversationPanel from "./components/ConversationPanel";
import axios from "axios";
import { Spinner } from "react-bootstrap";

function App() {
  const [courses, setCourses] = useState([]);
  const [messages, setMessages] = useState([]);
  //const [firstMessage, setFirstMessage] = useState(true);
  const [loading, setLoading] = useState(true);
  const [initialSetup, setInitialSetup] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await axios.get("http://localhost:3000/api/courses", {
          withCredentials: true,
        });
        setCourses(response.data);
        console.log("fetch courses:", response.data);
      } catch (error) {
        console.error("Error fetching courses:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  // 2.
  const handleInitialSetup = async (course, topic) => {
    try {
      setLoading(true);
      // 3. Send the initial setup request to the server
      const response = await axios.post(
        "http://localhost:3000/api/initial-query",
        { course, topic },
        {
          withCredentials: true,
        }
      );
      setLoading(false);
      console.log("Server Response:", response);
      const aiTextResponse = response.data.response.kwargs.content;
      setMessages([
        { type: "initialPrompt", text: response.data.augmentedQuery },
        { type: "ai", text: aiTextResponse },
      ]);
      setInitialSetup(false);
    } catch (error) {
      console.error("Error during initial setup:", error);
      setMessages([
        { type: "error", text: "Failed to initialize the AI tutor." },
      ]);
    }
  };

  const handleFollowUpSubmit = async (query) => {
    console.log("User Query:", query);

    // Create a local copy of the updated messages
    const updatedMessages = [...messages, { type: "user", text: query }];

    // Update the state with the new message
    setMessages(updatedMessages);

    //setMessages((prev) => [...prev, { type: "user", text: query }]);
    console.log("Messages at followup submit:", updatedMessages);
    setLoading(true);

    try {
      const response = await axios.post(
        "http://localhost:3000/api/follow-up-query",
        { messages: updatedMessages },
        {
          withCredentials: true,
        }
      );

      setLoading(false);
      // 4. Get the AI response from the server
      const aiTextResponse = response.data.response.kwargs.content;
      // Parse the JSON string to convert it into an array

      console.log("AI Text Response before parsing:", aiTextResponse);

      // Step 1: Find the index of the first comma
      const firstCommaIndex = aiTextResponse.indexOf(",");

      // Step 2: Extract the substring starting after the first comma
      let aiMessage = aiTextResponse.substring(firstCommaIndex + 1);

      // Step 3: Remove the leading and trailing double quotes and any escape characters
      aiMessage = aiMessage.trim();
      // if (aiMessage.startsWith('"')) {
      //   aiMessage = aiMessage.substring(1);
      // }

      // Remove any number of trailing brackets and quotes
      aiMessage = aiMessage.replace(/]+$/, "");
      //aiMessage = aiMessage.replace(/"$/, "");

      // // Step 4: Replace escaped characters
      // aiMessage = aiMessage.replace(/\\n/g, "\n").replace(/\\"/g, '"');

      console.log("AI Text Response:", aiMessage);
      console.log("AI Text Response type:", typeof aiMessage);

      //setMessages((prev) => [...prev, { type: "ai", text: aiMessage }]);

      setMessages((prev) => [...prev, { type: "ai", text: aiTextResponse }]);
    } catch (error) {
      console.error("Error during follow-up:", error);
      setMessages((prev) => [
        ...prev,
        { type: "error", text: "Failed to get a response from the AI tutor." },
      ]);
    }
  };

  // const handleQuerySubmit = async (query) => {
  //   setLoading(true);
  //   // Append the user's query to the conversation
  //   setMessages((prev) => [...prev, { type: "user", text: query }]);

  //   try {
  //     let response;
  //     if (firstMessage) {
  //       response = await axios.post("http://localhost:3000/api/initial-query", {
  //         prompt: query,
  //       });

  //       setMessages((prev) => [
  //         ...prev,
  //         { type: "retrievedData", text: response.data.retrievedData },
  //       ]);

  //       setFirstMessage(false);
  //     } else {
  //       response = await axios.post(
  //         "http://localhost:3000/api/follow-up-query",
  //         { prompt: messages } //query }
  //       );
  //     }
  //     // Make sure to access the response content correctly based on the actual structure
  //     const aiTextResponse = response.data.response.kwargs.content;

  //     // Append the AI's response to the conversation
  //     setMessages((prev) => [...prev, { type: "ai", text: aiTextResponse }]);
  //   } catch (error) {
  //     console.error("Error fetching data:", error);
  //     // Optionally append an error message to the conversation
  //     setMessages((prev) => [
  //       ...prev,
  //       { type: "error", text: "Failed to get a response from the AI tutor." },
  //     ]);
  //   } finally {
  //     setLoading(false); // Set loading to false when the response is received or an error occurs
  //   }
  // };

  return (
    <div className="container">
      <h1>AI Tutor</h1>
      <div className="conversation-container">
        {/* Pass messages to ConversationPanel to display them */}
        <ConversationPanel messages={messages} />
        {loading && ( // Render this line when loading is true
          <div>
            <span>Loading...</span>
            <Spinner animation="border" role="status" size="sm" />
          </div>
        )}
      </div>
      <div className="query-input-container">
        {initialSetup ? (
          <InitialSetupForm courses={courses} onSubmit={handleInitialSetup} />
        ) : (
          <QueryInput onSubmit={handleFollowUpSubmit} />
        )}
      </div>
    </div>
  );
}

function InitialSetupForm({ courses, onSubmit }) {
  const [course, setCourse] = useState("");
  const [topic, setTopic] = useState("");

  const handleCourseChange = (event) => setCourse(event.target.value);
  const handleTopicChange = (event) => setTopic(event.target.value);

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit(course, topic);
  };

  const selectedCourse = courses.find((c) => c.name === course);
  const topics = selectedCourse ? selectedCourse.topics : [];

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-3">
        <label>Select Course:</label>
        <select
          value={course}
          onChange={handleCourseChange}
          className="form-control"
        >
          <option value="">Select a course</option>
          {courses.map((c, index) => (
            <option key={index} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div className="mb-3">
        <label>Select Topic:</label>
        <select
          value={topic}
          onChange={handleTopicChange}
          className="form-control"
          disabled={!course}
        >
          <option value="">Select a topic</option>
          {topics.map((t, index) => (
            <option key={index} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>
      <button type="submit" className="btn btn-primary">
        Submit
      </button>
    </form>
  );
}

export default App;
