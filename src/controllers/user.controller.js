import { asyncHandler } from '../utils/asyncHandler.js'
import { apiError } from '../utils/apiError.js'
import { User } from '../models/user.mode.js'
import { apiResponse } from '../utils/apiResponse.js'
import { uploadOnCloudinary } from '../utils/uploader.js'

const registerUser = asyncHandler(async (req, res) => {

    //get user details from frontend
    const { fullName, username, email, password } = req.body

    //validate-not empty
    if ([fullName, username, email, password].some((field) => field?.trim() === "")) {
        throw new apiError(400, "all fields are required!")
    }

    //check if user already exists: username email
    const userExists = await User.findOne({
        $or: [
            { username },
            { email }
        ]
    })

    if (userExists) {
        throw new apiError(400, " User with the username and email already exists!!")
    }

    //check for images, avatar
    const avatarPath = req.files?.avatar[0]?.path
    const coImg = req.files?.coverImage[0]?.path

    if (!avatarPath) {
        throw new apiError(400, "avatar is required!!")
    }

    //upload them to cloudinary
    const avatarImage = await uploadOnCloudinary(avatarPath)
    const coverImage = await uploadOnCloudinary(coImg)

    if (!avatarImage) {
        throw new apiError(400, "avatar uploading failed!!")
    }

    //create user object - create entry in db
    const user = await User.create({
        fullName,
        avatar: avatarImage.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    //remove password and refresh token field from response
    const createdUser = await User.findById(user._id).select("-password -refreshToken")

    //check for user creation
    if (!createdUser) {
        throw new apiError(400, "user regester failed!")
    }

    //return res
    return res.status(200).json(
        new apiResponse(200, createdUser, "user entry success!!")
    )
})

const generateAccessAndRefreshToken = asyncHandler(async (userId) => {
    const user = await User.findById(userId)
    const accessToken = user.generateAccessToken()
    const refreshToken = user.generateRefreshToken()

    user.refreshToken = refreshToken
    await user.save({ validateBeforeSave: false })

    return { accessToken, refreshToken }
})

const loginUser = asyncHandler(async (req, res) => {
    //get email or username and password from req body
    const { email, username, password } = req.body

    //validate username or email
    if (!(username || email)) {
        throw new apiError(400, "Email or username is required!")
    }

    //find user
    const user = await User.findOne({
        $or: [{ username},{ email }]
    })

    //check if user exist
    if (!user) {
        throw new apiError(400, "User doesn't exists!")
    }

    //check password
    const isPasswordValid = await user.isPasswordCorrect(password)
    if (!isPasswordValid) {
        throw new apiError(400, "Invalid password!")
    }

    //generate access and refresh token 
    const { accessToken, refreshToken } = generateAccessAndRefreshToken(user)


    //send cookies and exclude password and refreshToken 
    const loggedIn = await User.findById(user._id).select("-password -refreshToken")
    const option = {
        httpOnly: true,
        secure: true
    }
    //return data
    return res.status(200)
        .cookies("accessToken", accessToken, option)
        .cookies("refreshToken", refreshToken, option)
        .json(new apiResponse(200,
            { user: loggedIn, accessToken, refreshToken },
            "You're logged in!."
        ))
})
export { registerUser, loginUser }