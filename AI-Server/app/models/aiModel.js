import dotenv from "dotenv";
dotenv.config();
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HarmBlockThreshold, HarmCategory } from "@google/generative-ai";
import natural from "natural";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { PDFLoader } from "langchain/document_loaders/fs/pdf";

// Configure the Gemini model
const model = new ChatGoogleGenerativeAI({
  model: "gemini-pro",
  maxOutputTokens: 2048,
  apiKey: process.env.GOOGLE_API_KEY, // Access the API key from environment variables
  safetySettings: [
    {
      category: HarmCategory.HARM_CATEGORY_HARASSMENT,
      threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
    },
  ],
});

const tokenizer = new natural.WordTokenizer();

// Load and preprocess documents
async function loadDocuments() {
  //const loader = new TextLoader("./data/lecture_material.txt");
  const loader = new PDFLoader("./data/DataStructuresNotes.pdf");
  const docs = await loader.load();
  console.log("Loaded documents:"); //, docs);
  return docs.map((doc) => preprocessDocument(doc));
}

function preprocessDocument(document) {
  // Basic preprocessing to split the document into manageable parts
  return document.pageContent.split(/\n\n/).map((section) => section.trim());
}

// Retrieve the most relevant data from loaded documents
async function retrieveData(query, documents) {
  const queryTokens = tokenizer.tokenize(query.toLowerCase());
  let bestMatch = null;
  let highestScore = 0;

  documents.forEach((section) => {
    section.forEach((paragraph) => {
      let paragraphTokens = tokenizer.tokenize(paragraph.toLowerCase());
      let intersection = paragraphTokens.filter((token) =>
        queryTokens.includes(token)
      );
      let score = intersection.length;

      if (score > highestScore) {
        highestScore = score;
        bestMatch = paragraph;
      }
    });
  });

  return (
    bestMatch ||
    "No detailed information found. Can you specify what part you're interested in?"
  );
}

// Generate the initial response with educational content
async function generateInitialResponse(prompt) {
  console.log("Prompt:", prompt);
  try {
    const documents = await loadDocuments();
    if (!documents.length) {
      return "Failed to load documents or documents are empty.";
    }
    const retrievedData = await retrieveData(prompt, documents);
    const augmentedQuery = retrievedData
      ? `${prompt} Considering this fact: ${retrievedData}.`
      : "Hello! I'm your AI-Tutor. What would you like to learn about today?";
    //const augmentedQuery = prompt;
    const response = await model.invoke([["human", augmentedQuery]]);
    //
    console.log("Response:", response.content);
    return {
      retrievedData: retrievedData,
      response: response,
      endConversation: false,
    };
  } catch (error) {
    console.error("Error during initial response generation:", error);
    return {
      response: "An error occurred while generating the response.",
      endConversation: true,
    };
  }
}

// // Generate follow-up responses based on user interaction
// async function generateFollowUpResponse(userInput, context) {
//   try {
//     const augmentedQuery = `${userInput.prompt} Considering your previous question: ${context.lastResponse}`;
//     const response = await model.invoke([["human", augmentedQuery]]);

//     return { response: response, endConversation: checkEndCondition(response) };
//   } catch (error) {
//     console.error("Error during follow-up response generation:", error);
//     return {
//       response: "An error occurred while generating the response.",
//       endConversation: true,
//     };
//   }
// }

// Generate follow-up responses based on user interaction
// async function generateFollowUpResponse(userInput, context) {
//   try {
//     const augmentedQuery = `${userInput.prompt} Considering your previous question: ${context.lastResponse}`;
//     const response = await model.invoke([["human", augmentedQuery]]);

//     return { response: response, endConversation: checkEndCondition(response) };
//   } catch (error) {
//     console.error("Error during follow-up response generation:", error);
//     return {
//       response: "An error occurred while generating the response.",
//       endConversation: true,
//     };
//   }
// }

async function generateFollowUpResponse(context) {
  try {
    // Convert the context object to a JSON string
    const contextText = JSON.stringify(context);
    const augmentedQuery = `$Answer the last question based on previous conversations: ${contextText}`;
    console.log("Augmented Query:", augmentedQuery);

    const response = await model.invoke([["human", augmentedQuery]]);

    return { response: response, endConversation: checkEndCondition(response) };
  } catch (error) {
    console.error("Error during follow-up response generation:", error);
    return {
      response: "An error occurred while generating the response.",
      endConversation: true,
    };
  }
}

// Check if the conversation should end
function checkEndCondition(response) {
  return response.text.includes("Do you have any other questions?");
}

export { generateInitialResponse, generateFollowUpResponse };
