import "dotenv/config";
//
import express from "express";
import session from "express-session";
import cors from "cors";
import bodyParser from "body-parser";
import tutorRoutes from "./app/routes/tutorRoutes.js"; // Note the `.js` extension

const app = express();
const PORT = process.env.PORT || 3000;

app.use(
  cors({
    origin: "http://localhost:5173", // client's origin
    credentials: true, // This allows the server to accept cookies
  })
);
app.use(bodyParser.json());
app.use(
  session({
    secret: "your_secret_key",
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: false, // Note: `secure: true` is only used if you are serving over HTTPS
      sameSite: "lax",
    },
  })
);

app.use("/api", tutorRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
