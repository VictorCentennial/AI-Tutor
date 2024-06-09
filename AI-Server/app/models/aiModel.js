import dotenv from "dotenv";
dotenv.config();
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HarmBlockThreshold, HarmCategory } from "@google/generative-ai";
import natural from "natural";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import fs from "fs";
import path from "path";
import { promisify } from "util";
//testing

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

// // Load and preprocess documents
// async function loadDocuments() {
//   //const loader = new TextLoader("./data/lecture_material.txt");
//   const loader = new PDFLoader("./data/DataStructuresNotes.pdf");
//   const docs = await loader.load();
//   console.log("Loaded documents:"); //, docs);
//   return docs.map((doc) => preprocessDocument(doc));
// }

// Load and preprocess documents with specific course and topic
async function loadDocuments(course, topic) {
  const filePath = `./data/${course}/${topic}`;
  console.log("loading documents from:", filePath);
  let loader;
  const ext = path.extname(filePath);
  if (ext === ".pdf") {
    loader = new PDFLoader(filePath);
  } else {
    loader = new TextLoader(filePath);
  }
  const docs = await loader.load();
  console.log("Loaded documents");
  // Preprocess the documents by splitting them into sections
  return docs.map((doc) => preprocessDocument(doc));
}

function preprocessDocument(document) {
  // Basic preprocessing to split the document into manageable parts
  return document.pageContent.split(/\n\n/).map((section) => section.trim());
}

// Read initial prompt from file using TextLoader
async function readInitialPrompt(course, topic) {
  const filePath = path.resolve(`./prompts/tutor_prompt.txt`);
  console.log("Reading initial prompt from:", filePath);
  const loader = new TextLoader(filePath);
  const docs = await loader.load();
  if (docs.length > 0) {
    console.log("Initial prompt loaded:", docs[0].pageContent.trim());
    return docs[0].pageContent.trim();
  } else {
    const defaultMessage = `Hello! I'm your AI-Tutor for ${course}, specifically on ${topic}. What would you like to learn about today?`;
    console.log(
      "Initial prompt file not found, using default message:",
      defaultMessage
    );
    return defaultMessage;
  }
}

//create a function to summarize the documents
async function summarizeDocuments(documents) {
  ///summarize the documents with appropirate prompt and invoke the model
  const prompt = `Summarize the documents to include all topicks from the documents: ${documents.join(
    "\n\n"
  )}`;
  //console.log("Summarizing documents with prompt:", prompt);

  try {
    const response = await model.invoke([["human", prompt]]);
    // console.log("Summarized documents response:", response);
    // console.log("Summarized documents:", response.content);
    return response.content;
  } catch (error) {
    console.error("Error during document summarization:", error);
    return "An error occurred while summarizing the documents.";
  }
}

// Generate the initial response with educational content
async function generateInitialResponse(
  course,
  topic,
  initialPrompt,
  documents
) {
  console.log(
    "Generating initial response for course:",
    course,
    "and topic:",
    topic
  );
  try {
    const initialDocuments = await summarizeDocuments(documents); //`\n\nDocuments:\n${documents.join("\n\n")}`;
    // Directly include the documents in the augmented query
    const augmentedQuery = `${initialPrompt} \n\n this is the summary of the documents: """${initialDocuments}"""`;

    console.log("Augmented Query:", augmentedQuery);

    // const response = await model.invoke([["human", augmentedQuery]]);

    //add initial documents during initial response generation, but not include in the conversation history
    const response = await model.invoke([["human", augmentedQuery]]);

    console.log("Response from model:", response.content);
    return {
      augmentedQuery: augmentedQuery,
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
    "No detailed information found. Ask user to query related information." //Can you specify what part you're interested in?"
  );
}

//convert messages into human and ai for model query
const convertMessages = (messages) => {
  return messages.map((msg) => {
    if (msg.type === "initialPrompt" || msg.type === "user") {
      return ["human", msg.text];
    } else if (msg.type === "ai") {
      return ["ai", msg.text];
    }
  });
};

async function readRepeatPrompt() {
  const filePath = path.resolve(`./prompts/repeat_prompt.txt`);
  console.log("Reading initial prompt from:", filePath);
  const loader = new TextLoader(filePath);
  const docs = await loader.load();
  if (docs.length > 0) {
    console.log("Initial prompt loaded:", docs[0].pageContent.trim());
    return docs[0].pageContent.trim();
  } else {
    const defaultRepeatPrompt = ` Consider tutoring rules before answering ay questions`;
    console.log(
      "Repeat prompt file not found, using default repeat prompt:",
      defaultRepeatPrompt
    );
    return defaultRepeatPrompt;
  }
}

async function generateFollowUpResponse(context, documents) {
  try {
    // Convert the context object to a JSON string
    const contextText = JSON.stringify(convertMessages(context.messages));
    // const augmentedQuery = `$Answer the last user's question based on the conversation historys: ${contextText}`;
    // console.log("Augmented Query:", augmentedQuery);

    const repeatPrompt = await readRepeatPrompt();

    const modelQuery = JSON.parse(contextText);

    // console.log("Model Query:", modelQuery);
    // console.log(`type of modelQuery: ${typeof modelQuery}`);
    // console.log(`modelQuery.length: ${modelQuery.length}`);
    // console.log(
    //   `modelQuery[modelQuery.length - 1]: ${modelQuery[modelQuery.length - 1]}`
    // );

    const query = modelQuery[modelQuery.length - 1][1];

    // console.log(`query: ${query}`);
    // console.log(`type of documents: ${typeof documents}`);

    const queryRelatedContent = await retrieveData(query, documents);
    const newQuery = [
      "human",
      `${query}, answer the question based on the notes provided if related.\n notes:"""${queryRelatedContent}""". Obey the tutor rules when answering the query from user: \n tutor rules:"""${repeatPrompt}"""`,
    ];

    console.log(`newQuery: ${newQuery}`);

    // new model query modified last query to include retrived notes and tutor rules
    // it is use to invoke the model but is not included in the conversation history
    const newModelQuery = [
      ...modelQuery.slice(0, modelQuery.length - 1),
      newQuery,
    ];

    console.log("Model Query:", modelQuery);
    console.log("New Model Query:", newModelQuery);
    // console.log("type of New Model Query:", typeof newModelQuery);

    //repeatPrompt is used to invoke the model but is not included in the
    const response = await model.invoke(newModelQuery);

    console.log("Response from model:", response.content);

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

const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

const getCoursesAndTopics = () => {
  return new Promise(async (resolve, reject) => {
    try {
      const coursesDir = path.join("data"); // Adjusted path
      const entries = await readdir(coursesDir);
      const courses = [];

      // Map each folder to a promise
      const folderPromises = entries.map(async (folder) => {
        const folderPath = path.join(coursesDir, folder);
        const folderStats = await stat(folderPath);

        if (folderStats.isDirectory()) {
          const files = await readdir(folderPath);
          courses.push({ name: folder, topics: files });

          // // Remove file extensions from filenames
          // const topics = files.map((file) =>
          //   path.basename(file, path.extname(file))
          // );
          // courses.push({ name: folder, topics });
        }
      });

      // Wait for all folder promises to resolve
      await Promise.all(folderPromises);

      console.log("Courses: ", courses);
      resolve(courses);
    } catch (error) {
      reject(`Failed to read courses directory: ${error.message}`);
    }
  });
};

export {
  generateInitialResponse,
  generateFollowUpResponse,
  getCoursesAndTopics,
  loadDocuments,
  readInitialPrompt,
};
