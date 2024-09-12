import {asyncHandler} from '../utils/asyncHandler.js'
import {ApiError} from '../utils/ApiError.js'
import User from '../models/user.model.js'
import {uploadOnCloudinary} from '../utils/cloudinary.js'
import {ApiResponse} from '../utils/ApiResponse.js'
import jwt  from 'jsonwebtoken'

const generateAccessAndRefreshToken = async(userID) =>{
    //generate access token
    //generate refresh token
    //return both
    try {
        const user =  await User.findById(userID)
        const accessToken = await user.generateAccessToken()
        const refreshToken = await user.generateRefreshToken()
        user.refreshToken = refreshToken
        console.log(user.refreshToken);
        
        await user.save({validateBeforeSave: false})
        return {accessToken, refreshToken}
    } catch (error) {
        throw new ApiError(500, "Token generation failed")
    }
}

const registerUser = asyncHandler(async (req, res) => {
    //get user details from frontend.
    //apply validation rules.- not empty, email, password length, etc.
    //check if user already exist in database. :username or :email
    //check for images,avatar
    //upload to cloudinary
    //get cloudinary url, avatar.
    //create user object. -- create entry in db
    //remove password and refresh token fields from response.
    //check for user creation
    //return response
    
    const {username,email ,fullName, password } = req.body
    console.log(username,email ,fullName, password);

    // if(fullName===""){
    //     throw new ApiError(400, "fullName is required")
    // }
    if(
        [fullName,email,username,password].some((field)=>{
            return field?.trim() === ""
        })
    ){
        throw new ApiError(400, "All fields are required")
    }

    const existedUser = await User.findOne({
        $or:[
            {email},
            {username}
        ]
    })
    if(existedUser){
        throw new ApiError(409, "User already exists")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path
    // const coverImageLocalPath = req.files?.coverImage[0]?.path

    let coverImageLocalPath;
    if(req.files&&Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
        coverImageLocalPath = req.files?.coverImage[0]?.path
    }

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar is required")
    }
    console.log(req.files,avatarLocalPath,coverImageLocalPath);

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar){
        throw new ApiError(500, "Avatar upload failed")
    }
    
    const user = await User.create({
        fullName,
        email, 
        username: username.toLowerCase(), 
        password, 
        avatar: avatar.url,
        coverImage: coverImage?.url || ""
    })

    console.log(user);
    

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser){
        throw new ApiError(500, "User creation failed")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser,"User created successfully")
    );
})

const loginUser = asyncHandler(async (req, res) => {
    //request body se data le aao 
    //username or email
    //find the user
    //password check 
    //access and refresh token generation
    //send cookies
    const {email, username, password} = req.body
    if(!username && !email){
        throw new ApiError(500, "username or email required")
    }

    const user = await User.findOne({
        $or: [{username},{email}]
    })

    if(!user){
        throw new ApiError(404, "User not found")
    }

    const isPasswordCorrect = await user.isPasswordCorrect(password)
    if(!isPasswordCorrect){
        throw new ApiError(401, "Invalid credentials")
    }

    const {refreshToken, accessToken} = await generateAccessAndRefreshToken(user._id)
    
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200,
            {
                user: loggedInUser, accessToken, refreshToken
            },
            "User LoggedIn successfully", 
        )
    )
})

const logoutUser = asyncHandler(async (req, res) => {
    //clear cookies
    //return response
    console.log("User:", res.user);
    await User.findByIdAndUpdate(
        res.user._id,
        {
            $set:{
                refreshToken: undefined
            }
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(
        new ApiResponse(200, {}, "User logged out successfully")
    )
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;
    if(!incomingRefreshToken){
        throw new ApiError(401, "Unauthorized")
    }
    try {
        const decodedToken = jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)
        const user = await User.findById(decodedToken._id)
        if(!user){
            throw new ApiError(401, "Invalid refresh Token")
        }
        if(incomingRefreshToken !== user?.refreshToken){
            throw new ApiError(401, "Refresh Token is Expired")
        }
        const options = {
            httpOnly: true,
            secure: true
        }
        const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id)
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200, 
                {
                    accessToken, 
                    refreshToken
                }),
                "Token refreshed successfully"
            )
    } catch (error) {
        throw new ApiError(401, error?.message||"Invalid request")
        console.log(error)
    }
})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken
}