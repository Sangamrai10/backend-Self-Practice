import { app } from "./app.js"
import dotenv from 'dotenv'
import connectDB from "./database/database.js"
dotenv.config({
    path: "./.env"
})

connectDB()
    .then(() => {
        app.on("error", () => {
            console.log("Server error!!", error)
        })
        
        app.listen(process.env.PORT || 8000, () => {
            console.log(`Server running at http://localhost:${process.env.PORT}`)
        })
    })
    .catch((error) => {
        console.log("Database connection failed!", error)
    })
