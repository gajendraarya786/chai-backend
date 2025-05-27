class ApiError extends Error{
     constructor(
        statusCode,
        message= "Something went wrong",
        errors = [],
        stack= ""
     ){
        super(message)
        this.statusCode = statusCode
        this.data = null
        this.message = message
        this.success = false;
        this.errors = errors
        
        //This code is written in production in companies ignore it for a while
        if(stack){
            this.stack = stack
        }else{
            Error.captureStackTrace(this, this.constructor)
        }
     }
}

export {ApiError}