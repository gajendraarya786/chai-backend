//import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import {User} from '../models/user.models.js'
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

//we can write controllers without using asyncHandler like below using try catch
const registerUser = async (req, res, next) => {
    //get user details from frontend
    //validation - not empty
    //check if user already exists: by username, email
    //check for images, check for avatar
    //upload them to cloudinary, avatar
    // create user object - create entry in db 
    //remove password and refresh token field from response
    //check for user creation
    //return response
    

    //Step-1 Getting details from frontend
    const {fullname, email, username, password } = req.body;
    console.log("email:" , email);
    console.log("password:", password);
    
    //Validating
    if(fullname === ""){
        throw new ApiError(400, "fullname is required");
    }
    if(email === ""){
        throw new ApiError(400, "email is required");
    }
    if(username === ""){
        throw new ApiError(400, "username is required");
    }
    if(password === ""){
        throw new ApiError(400, "password is required");
    }
    
   //Checking if user already exists 
   const existedUser =  User.findOne({
        $or: [{username}, {email}]
    })
    if(existedUser){
        throw new ApiError(409, "User already exists");
    }

    //checking for files (multer gives access to req.fils method)
    const avatarLocalPath = req.files?.avatar[0]?.path
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is required");
    }
    
    //Uploading on cloudinary 
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
     
    if(!avatar){
        throw new ApiError(400, "Avatar file is required");
    }
    
    //creating a user
    const user = await User.create({
        fullname: fullname,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email: email,
        password: password,
        username: username.toLowerCase()
    })
    
    const createdUser = await User.findById(user._id).select("-password -refreshToken");

    if(!createdUser){
        throw new ApiError(500, "Something went wrong while registering the user");
    }
    else{
       return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully")
       )
    }
}


// const registerUser = asyncHandler( async (req, res) => {
//         res.status(200).json({
//         message: "ok"
//     })
// })

export {registerUser}