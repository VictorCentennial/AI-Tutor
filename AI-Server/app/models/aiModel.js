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
    // Directly include the documents in the augmented query
    const augmentedQuery = `${initialPrompt}\n\nDocuments:\n${documents.join(
      "\n\n"
    )}`;
    console.log("Augmented Query:", augmentedQuery);

    // const response = await model.invoke([["human", augmentedQuery]]);

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

// // Retrieve the most relevant data from loaded documents
// async function retrieveData(query, documents) {
//   const queryTokens = tokenizer.tokenize(query.toLowerCase());
//   let bestMatch = null;
//   let highestScore = 0;

//   documents.forEach((section) => {
//     section.forEach((paragraph) => {
//       let paragraphTokens = tokenizer.tokenize(paragraph.toLowerCase());
//       let intersection = paragraphTokens.filter((token) =>
//         queryTokens.includes(token)
//       );
//       let score = intersection.length;

//       if (score > highestScore) {
//         highestScore = score;
//         bestMatch = paragraph;
//       }
//     });
//   });

//   return (
//     bestMatch ||
//     "No detailed information found. Can you specify what part you're interested in?"
//   );
// }

// // Generate the initial response with educational content
// async function generateInitialResponse(prompt) {
//   console.log("Prompt:", prompt);
//   try {
//     const documents = await loadDocuments();
//     if (!documents.length) {
//       return "Failed to load documents or documents are empty.";
//     }
//     const retrievedData = await retrieveData(prompt, documents);
//     const augmentedQuery = retrievedData
//       ? `${prompt} Considering this fact: ${retrievedData}.`
//       : "Hello! I'm your AI-Tutor. What would you like to learn about today?";
//     //const augmentedQuery = prompt;
//     const response = await model.invoke([["human", augmentedQuery]]);
//     //
//     console.log("Response:", response.content);
//     return {
//       retrievedData: retrievedData,
//       response: response,
//       endConversation: false,
//     };
//   } catch (error) {
//     console.error("Error during initial response generation:", error);
//     return {
//       response: "An error occurred while generating the response.",
//       endConversation: true,
//     };
//   }
// }

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

async function generateFollowUpResponse(context) {
  try {
    // Convert the context object to a JSON string
    const contextText = JSON.stringify(convertMessages(context.messages));
    // const augmentedQuery = `$Answer the last user's question based on the conversation historys: ${contextText}`;
    // console.log("Augmented Query:", augmentedQuery);

    const modelQuery = contextText;
    console.log("Model Query:", modelQuery);

    const response = await model.invoke(modelQuery);

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

//Get courses and topics for data folder
// function getCoursesAndTopics() {
//   return new Promise((resolve, reject) => {
//     const coursesDir = path.join("data"); // Adjust the path as needed
//     const courses = [];

//     fs.readdir(coursesDir, (err, folders) => {
//       if (err) {
//         return reject(`Failed to read courses directory ${coursesDir}: ${err}`);
//       }

//       let foldersProcessed = 0;

//       folders.forEach((folder) => {
//         const folderPath = path.join(coursesDir, folder);

//         console.log("Folder Path: ", folderPath);

//         fs.stat(folderPath, (err, stats) => {
//           if (err) {
//             return reject(`Failed to stat entry: ${entry}`);
//           }

//           if (stats.isDirectory()) {
//             fs.readdir(folderPath, (err, files) => {
//               if (err) {
//                 return reject(`Failed to read folder: ${folder}`);
//               }

//               console.log("Files: ", files, "Folder: ", folder);

//               courses.push({ name: folder, topics: files });
//             });
//           }
//           foldersProcessed++;

//           if (foldersProcessed === folders.length) {
//             console.log("Courses: ", courses);
//             resolve(courses);
//           }
//         });
//       });
//     });
//   });
// }

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

//TODO - course path and name should be given by user
const getFilesInCourse = (courseName) => {
  return new Promise(async (resolve, reject) => {
    try {
      const coursePath = path.join("data", courseName);
      const files = await readdir(coursePath);
      const filePaths = files.map((file) => path.join(coursePath, file));
      resolve(filePaths);
    } catch (error) {
      reject(`Failed to read files in course directory: ${error.message}`);
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
