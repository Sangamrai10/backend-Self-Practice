import express, { urlencoded } from "express";
import cors from 'cors'
import cookieParser from 'cookie-parser'

const app=express()
app.use(cors({
    origin: process.env.CORS_ORIGIN || "*",
    credentials:true
}))

app.use(cookieParser())
app.use(express.urlencoded({extended: true, limit:"16kb"}))
app.use(express.json({
    limit:'16kb'
}))
app.use(express.static("public"))





app.get('/',(req, res)=>{
    res.send("Hello world")
})

export {app}