import {
  generateInitialResponse,
  generateFollowUpResponse,
  getCoursesAndTopics,
  readInitialPrompt,
  loadDocuments,
} from "../models/aiModel.js";

// Controller to handle the initial user query
export async function handleInitialQuery(req, res) {
  const { course, topic } = req.body;
  console.log(
    "Received initial request with course:",
    course,
    "and topic:",
    topic
  );

  try {
    const initialPrompt = await readInitialPrompt(course, topic);
    const documents = await loadDocuments(course, topic);

    //store the documents in the session for the follow-up retrival process
    req.session.documents = documents;

    // console.log(
    //   `type of documents in initial prompt: ${typeof req.session.documents}`
    // );
    // console.log("Initial request session ID:", req.session.id);
    // console.log("Session before setting documents:", req.session);

    const result = await generateInitialResponse(
      course,
      topic,
      initialPrompt,
      documents
    );
    console.log("Generated initial response:", result.response);

    res.json({
      augmentedQuery: result.augmentedQuery,
      response: result.response,
      endConversation: result.endConversation,
    });
  } catch (error) {
    console.error("Error in handleInitialQuery:", error);
    res.status(500).send({ message: "Error in generating initial response." });
  }
}

export async function handleFollowUpQuery(req, res) {
  const context = req.body;
  try {
    // console.log(`userInput: ${userInput}`);
    // console.log(`lastResponse: ${req.session.lastResponse}`);

    // console.log("Follow-up request session ID:", req.session.id);
    // console.log("Session documents in follow-up:", req.session.documents);
    // console.log(
    //   `type of documents in controller: ${typeof req.session.documents}`
    // );

    // Inside handleFollowUpQuery
    const documents = req.session.documents;

    const result = await generateFollowUpResponse(context, documents);

    req.session.lastResponse = result.response; //can be refractor to add use session to store previous history instead of load it every time
    res.json({
      response: result.response,
      endConversation: result.endConversation,
    });
  } catch (error) {
    res
      .status(500)
      .send({ message: "Error in generating follow-up response." });
  }
}

export async function getCourses(req, res) {
  try {
    const courses = await getCoursesAndTopics();
    res.json(courses);
  } catch (error) {
    res.status(500).send({ message: `Error in loading courses: ${error}` });
  }
}
