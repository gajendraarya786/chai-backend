import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser';

const app = express()

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

//to set limit for incoming data files in json format
app.use(express.json({limit: "16kb"}));

//to encode the data in url
app.use(express.urlencoded({extended: true, limit: "16kb"}));

app.use(express.static("public"));
app.use(cookieParser())


export {app}