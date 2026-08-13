import express from "express";
import connectDB from "./db.js";
import cors from 'cors';
import userRoute from './routes/user.route.js'
import groupRoute from './routes/group.route.js'
import expenseRoute from './routes/expense.route.js'
import settleUpRoute from './routes/settleup.route.js'
import feedbackRoute from './routes/feedback.route.js'
import personalExpenseRoute from './routes/personalExpense.route.js'
import dotenv from "dotenv";
dotenv.config();


const app = express();
import http from "http";
import { initSocket } from "./socket.js";
const server = http.createServer(app);
initSocket(server);

const port = process.env.PORT || 5000;

connectDB();

app.use(express.json());
app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}))


app.get('/test', (req,res)=>{
    res.json({message: "Working...."});
})

app.use('/user',userRoute);
app.use('/group',groupRoute);
app.use('/expense',expenseRoute);
app.use('/settleup',settleUpRoute);
app.use('/feedback',feedbackRoute);
app.use('/personal-expense', personalExpenseRoute);


server.listen(port, '0.0.0.0',() => {
    console.log(`Server is running on port ${port}`);
});
