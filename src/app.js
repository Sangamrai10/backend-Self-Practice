import express, { urlencoded } from "express";
import cors from 'cors'
import cookieParser from 'cookie-parser'

const app = express()
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

//cookie
app.use(cookieParser())

//read url
app.use(express.urlencoded({
    extended: true,

    //set limit
    limit: "16kb"
}))

//accept json data
app.use(express.json({
    //set limit
    limit: '16kb'
}))

//store image
app.use(express.static("public"))


// routes import 
import userRouter from './routes/user.routes.js'

// routes declarations 
app.use("/api/v1/users", userRouter)

app.get('/', (req, res) => {
    res.send("<h1>Hello</>")
})
export { app }