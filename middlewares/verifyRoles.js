const { Forbidden, UnauthorizedError } = require("../errors")

const verifyRoles = (...allowedRoles) => {
    return (req, res, next) => {

        if (!req?.roles) {
            throw new UnauthorizedError('You are not allowed to access this route')
        }
        const newAllowedRoles = [...allowedRoles]
        const result = req.roles.map(role => newAllowedRoles.includes(role)).filter(val => val === true)

        if (result.length < 1 ) {
            throw new Forbidden('You are not allowed to access this route')
        }
        next()
    }
}

module.exports = verifyRoles