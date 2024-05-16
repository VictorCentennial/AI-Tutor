import { generateInitialResponse, generateFollowUpResponse } from '../models/aiModel.js';

// Controller to handle the initial user query
export async function handleInitialQuery(req, res) {
  // Extract the AI Tutor prompt from the request body
  // This prompt turns the LLM into a Tutor
  // includes the initial greeting
  // and reference to topic materials
  const prompt = req.body.prompt;  
  console.log("Prompt: ", prompt);
  try {
    const result = await generateInitialResponse(prompt);
    res.json({ response: result.response, endConversation: result.endConversation });
  } catch (error) {
    res.status(500).send({ message: "Error in generating initial response." });
  }
};

// Controller to handle follow-up interactions
export async function handleFollowUpQuery(req, res) {
  const userInput = req.body; 
  try {
    const result = await generateFollowUpResponse(userInput, { lastResponse: req.session.lastResponse });
    req.session.lastResponse = result.response;
    res.json({ response: result.response, endConversation: result.endConversation });
  } catch (error) {
    res.status(500).send({ message: "Error in generating follow-up response." });
  }
};
