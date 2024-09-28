import { asyncHandler } from '../utils/asyncHandler.js'
import { apiError } from '../utils/apiError.js'
import { User } from '../models/user.mode.js'
import { apiResponse } from '../utils/apiResponse.js'

const registerUser = asyncHandler(async (req, res) => {
    //get user details from frontend
    //validate-not empty
    //check if user already exists: username email
    //check for images, avatar
    //upload them to cloudinary
    //create user object - create entry in db
    //remove password and refresh token field from response
    //check for user creation
    //return res

    const { username, email, password } = req.body

    if ([username, email, password].some((field) => field?.trim() === "")) {
        throw new apiError(400, "all fields are required!")
    }

    const useraExists = User.findOne({
        $or: [
            { username },
            { email }
        ]
    })

    if (useraExists) {
        throw new apiError(400, " User with the username and email already exists!!")
    }

    const avatarPath = req.files?.avatar[0]?.path
    const coImg = req.files?.coImg[0]?.path

    if (!avatarPath) {
        throw new apiError(400, "avatar is required!!")
    }

    return res.status(200).json(
        new apiResponse(200, data, "user entry success!!")
    )
})

export { registerUser}