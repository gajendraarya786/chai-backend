

export const verifyJWT = async(req, resizeBy, next) => {
    try {
        req.cookies?.accessToken || req.header("Authorization")
    } catch (error) {
        
    }
}