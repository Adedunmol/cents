const jwt = require('jsonwebtoken')
const { UnauthorizedError } = require('../errors')


const verifyJWT = async (req, res, next) => {
    const authHeader = req.headers.authorization || req.headers.Authorization

    if (!authHeader?.startsWith('Bearer ')) {
        throw new UnauthorizedError('You do not have the access token')
    }
    const accessToken = authHeader.split(' ')[1]

    jwt.verify(
        accessToken,
        process.env.ACCESS_TOKEN_SECRET,
        (err, data) => {
            if (err) {
                throw new UnauthorizedError('Bad Access Token')
            }
            req.id = data.UserInfo.id
            req.user = data.UserInfo.email
            req.roles = data.UserInfo.roles
            next()
        }
    )
}


module.exports = verifyJWT