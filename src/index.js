import {app} from "./app.js"
import {apiError} from './utils/apiError.js'
import dotenv from 'dotenv'

dotenv.config({
    path:"./.env"
})
app.listen(process.env.PORT || 8000,()=>{
    console.log(`server running at: http://localhost:${process.env.PORT}`)
})
app.on("error",()=>{
throw new apiError(500, "server connection failed!")
})