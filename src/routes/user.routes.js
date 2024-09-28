import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";

const router= Router()
const resp=()=>{
    return "hello"
}
router.route("/register").post(resp)

export default router