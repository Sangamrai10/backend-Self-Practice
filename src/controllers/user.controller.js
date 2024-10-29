import { asyncHandler } from '../utils/asyncHandler.js'
import { apiError } from '../utils/apiError.js'
import { User } from '../models/user.mode.js'
import { apiResponse } from '../utils/apiResponse.js'
import { uploadOnCloudinary } from '../utils/uploader.js'
import jwt from 'jsonwebtoken'

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

const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return {
            accessToken,
            refreshToken
        }
    } catch (error) {
        throw new apiError(500, error.message)
    }
}

const loginUser = asyncHandler(async (req, res) => {
    //get email or username and password from req body
    const { email, username, password } = req.body

    //validate username or email
    if (!(username || email)) {
        throw new apiError(400, "Email or username is required!")
    }

    //find user
    const user = await User.findOne({
        $or: [{ username }, { email }]
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
    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user)


    //send cookies and exclude password and refreshToken 
    const loggedIn = await User.findById(user._id).select("-password -refreshToken")

    const option = {
        httpOnly: true,
        secure: true
    }
    //return data
    return res.status(200)
        .cookie("accessToken", accessToken, option)
        .cookie("refreshToken", refreshToken, option)
        .json(new apiResponse(200,
            { user: loggedIn, accessToken, refreshToken },
            "You're logged in!."
        ))
})

const logoutUser = asyncHandler(async (req, res) => {
    //find and update user and 
    await User.findByIdAndUpdate(
        //get user id from request body
        req.user._id, {
        $set: {
            //remove accessToken
            refreshToken: undefined
        }
    }
    )
    //set cookie option
    const option = {
        httpOnly: true,
        secure: true
    }
    //return response with cookie and data as json
    return res.status(200)
        // clear cookeis 
        .clearCookie("accessToken", option)
        .clearCookie("refreshToken", option)
        //json data
        .json(new apiResponse(200, {}, "Log out success!!"))
})

const refreshAccessToken = asyncHandler(async (req, res) => {

    // get cookies from req.cookies or body
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    //check if cookies are comming 
    if (!incomingRefreshToken) {
        throw new apiError(401, "unauthorized request")
    }

    try {
        //decode jwt token
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )

        //get user id decoded._id
        const user = await User.findById(decodedToken?._id)

        //check if refresh token valid
        if (!user) {
            throw new apiError(401, "Invalid refresh token")
        }

        //check if refresh token match with user
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new apiError(401, "Refresh token expired or already used!")
        }

        // cookie options 
        const option = {
            httpOnly: true,
            secure: true
        }

        //generate access and refresh token and destructure
        const { accessToken, newRefreshToken } = await generateAccessAndRefreshToken(user._id)

        //return response
        return res.status(200)

            //return cookie both tokens
            .cookie("refreshToken: ", newRefreshToken, option)
            .cookie("accessToken: ", accessToken, option)

            //return json file
            .json(new apiResponse(200,
                {
                    accessToken,
                    refreshToken: newRefreshToken
                },
                "Access token refreshed "
            ))
    } catch (error) {
        throw new apiError(400, error?.message || "Invalid refresh token")
    }
})

const changePassword = asyncHandler(async (req, res) => {

    // get old and new password from req.body
    const { oldPassword, newPassword } = req.body

    //get user id from database
    const user = await User.findById(req.user._id)

    //check if oldPassword matches from database
    const passwordCorrect = user.isPasswordCorrect(oldPassword)

    //check if password is correct or valid
    if (!passwordCorrect) {
        throw new apiError(400, "Password does not match")
    }

    //set new password
    user.password = newPassword

    // user.save and validateBeforeSave: false
    await user.save({ validateBeforeSave: false })

    //return responses
    return res.status(200)
        .json(new apiResponse(200, {}, "Password changed successfully!!"))
})

const getCurrentUser = asyncHandler(async (req, res) => {
    return res.status(200)
        .json(new apiResponse(200, req.user, "Current user fetched!!"))
})

const updateAccount = asyncHandler(async (req, res) => {

    //extract fullname and email from body
    const { fullName, email } = req.body

    //check if extracted fields are not enpty
    if (!fullName || email) {
        throw new apiError(400, "All fields are required!!")
    }

    //get user by id and update
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            //set fullname and email
            $set: {
                fullName,
                email
            },
        },
        { new: true }

        //select to remove sensitive fields like passwoed
    ).select("-passwor")

    //return response in json format
    return res.status(200)
        .json(new apiResponse(200, user, "Updated successfully!!"))
})

const updateAvatar = asyncHandler(async (req, res) => {

    //extract avatar path from req obj
    const avatarPath = req.files?.path

    //check if avatar being recieved
    if (!avatarPath) {
        throw new apiError(404, "avatar not found!")
    }

    //upload avatar to cloudinary
    const avatar = await uploadOnCloudinary(avatarPath)

    //check if avatar uploaded 
    if (!avatar.url) {
        throw new apiError(400, "avatar upload failed!")
    }

    //get user by id from database
    const user = await User.findByIdAndUpdate(

        //get user id from req obj
        req.user._id,
        {
            //set new avatar
            $set: {
                avatar: avatar.url
            }
        },
        { new: true }

        //select sensitive fields
    ).select("-password")

    // return response in json format 
    return res.status(200)
        .json(new apiResponse(200, user, "Updated successfully!!"))
})

const updateCover = asyncHandler(async (req, res) => {

    //get cover image path from req obj
    const coverPath = req.files?.path

    //check if cover being recieved
    if (!coverPath) {
        throw new apiError(404, "Cover image not found!")
    }

    //upload it on cloudinary
    const cover = await uploadOnCloudinary(coverPath)
    //check if cover uploaded
    if (!cover.url) {
        throw new apiError(400, "coverImage Upload failed!!")
    }

    //get user from database
    const user = await User.findByIdAndUpdate(
        //get user id from req.use obj
        req.user._id,
        {
            //set new coverImage
            $set: {
                coverImage: cover.url
            }
        }, { new: true }

        //select sensitive fields
    ).select("-password")

    //return response in json format
    return res.status(200)
        .json(new apiResponse(200, user, "Updated successfully!!"))
})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changePassword,
    getCurrentUser,
    updateAccount,
    updateAvatar,
    updateCover
}