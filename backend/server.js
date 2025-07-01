import express from "express";
import connectDB from "./db.js";
import dotenv from "dotenv";
dotenv.config();


const app = express();
const port = process.env.PORT || 3001;

connectDB();

app.use(express.json());



app.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`);
});
