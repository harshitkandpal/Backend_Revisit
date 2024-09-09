import {asyncHandler} from '../utils/asyncHandler.js'
import {ApiError} from '../utils/ApiError.js'
import User from '../models/user.model.js'
import {uploadOnCloudinary} from '../utils/cloudinary.js'
import {ApiResponse} from '../utils/ApiResponse.js'

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

    const existedUser = User.findOne({
        $or:[
            {email},
            {username}
        ]
    })
    if(existedUser){
        throw new ApiError(409, "User already exists")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path
    const coverImageLocalPath = req.files?.coverImage[0]?.path

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

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser){
        throw new ApiError(500, "User creation failed")
    }

    return res.status(201).json(
        new ApiResponse(200, "User created successfully", createdUser)
    );
})

export {
    registerUser,
}