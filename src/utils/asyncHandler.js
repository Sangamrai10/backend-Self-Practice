const asyncHandler = (handle)=>{
    return (req, res, next)=>{
        Promise.resolve(handle(req,res,next)).catch((err)=>next(err))
        //Error says next is not a function
    }
}

export {asyncHandler}