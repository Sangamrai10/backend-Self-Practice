import { apiError } from "../utils/apiError.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import jwt, { decode } from 'jsonwebtoken'
import { User } from "../models/user.mode.js"

export const verifyJWT = asyncHandler(async (req, _, next) => {
    try {
        //extract access token from req obj or header bearer
        const token = req.cookies?.accessToken || req.header("authorization")?.replace("Bearer", "")

        //check if token is being recieved 
        if (!token) {
            throw new apiError(401, "Invalid access token!")
        }

        //decode access token
        const decodedToken =jwt.verify(
            token,
            process.env.ACCESS_TOKEN_SECRET
        )
        
        //find user on DB with decoded token id
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")

        //check user has valid token
        if(!user){
            throw new apiError(401, "Invalid access token!!")
        }
        //set user to req.user
        req.user = user
        //execute next if successful
        next()
    } catch (error) {
        // throw error 
        throw new apiError(400, error?.message || "Invalid access token!!")
    }

})