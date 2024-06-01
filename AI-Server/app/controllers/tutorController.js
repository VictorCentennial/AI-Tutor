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

// // Controller to handle the initial user query
// export async function handleInitialQuery(req, res) {
//   // Extract the AI Tutor prompt from the request body
//   // This prompt turns the LLM into a Tutor
//   // includes the initial greeting
//   // and reference to topic materials
//   const prompt = req.body.prompt;
//   console.log("Prompt: ", prompt);
//   try {
//     const result = await generateInitialResponse(prompt);
//     res.json({
//       retrievedData: result.retrievedData,
//       response: result.response,
//       endConversation: result.endConversation,
//     });
//     console.log("initial");
//   } catch (error) {
//     res.status(500).send({ message: "Error in generating initial response." });
//   }
// }

// Controller to handle follow-up interactions
// export async function handleFollowUpQuery(req, res) {
//   const userInput = req.body;
//   try {
//     // console.log(`userInput: ${userInput}`);
//     // console.log(`lastResponse: ${req.session.lastResponse}`);

//     const result = await generateFollowUpResponse(userInput, {
//       lastResponse: req.session.lastResponse,
//     });
//     req.session.lastResponse = result.response;
//     res.json({
//       response: result.response,
//       endConversation: result.endConversation,
//     });
//   } catch (error) {
//     res
//       .status(500)
//       .send({ message: "Error in generating follow-up response." });
//   }
// }

export async function handleFollowUpQuery(req, res) {
  const context = req.body;
  try {
    // console.log(`userInput: ${userInput}`);
    // console.log(`lastResponse: ${req.session.lastResponse}`);

    const result = await generateFollowUpResponse(context);
    req.session.lastResponse = result.response;
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
