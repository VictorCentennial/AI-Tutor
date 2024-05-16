import 'dotenv/config';
//
import express from 'express';
import session from 'express-session';
import cors from 'cors';
import bodyParser from 'body-parser';
import tutorRoutes from './app/routes/tutorRoutes.js'; // Note the `.js` extension

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(session({
  secret: 'your_secret_key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: true } // Note: `secure: true` is only used if you are serving over HTTPS
}));

app.use('/api', tutorRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
