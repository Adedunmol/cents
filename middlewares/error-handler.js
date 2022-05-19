const { StatusCodes } = require('http-status-codes')


const errorHandlerMiddleware = (err, req, res, next) => {

    let customError = {
        statusCode: err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR,
        message: err.message || 'Something went wrong, please try again later'
    }

    //mongoose errors
    //Duplicate fields
    if (err.code && err.code === 11000) {
        customError.message = `Duplicate value entered for ${Object.values(err.keyValue)} field`
        customError.statusCode = StatusCodes.BAD_REQUEST
    }

    //validation errors for empty values
    if (err.name === 'ValidationError') {
        customError.message = Object.values(err.errors).map((item) => item.message).join(',')
        customError.statusCode = StatusCodes.BAD_REQUEST
    }

    //cast error for bad IDs
    if (err.name === 'CastError') {
        customError.message = `No item found with id: ${err.value}`
        customError.statusCode = StatusCodes.NOT_FOUND
    }

    return res.status(customError.statusCode).json({message: customError.message})
}


module.exports = errorHandlerMiddleware