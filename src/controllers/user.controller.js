//import { asyncHandler } from "../utils/asyncHandler.js";

//we can write controllers without using asyncHandler like below using try catch
const registerUser = async (req, res, next) => {
    try {
        res.status(200).json({
            message: "ok"
        })
    } catch (error) {
        next(error);
    }
}


// const registerUser = asyncHandler( async (req, res) => {
//         res.status(200).json({
//         message: "ok"
//     })
// })

export {registerUser}