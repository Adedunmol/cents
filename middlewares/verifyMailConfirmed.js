const { UnauthorizedError, Forbidden } = require("../errors")
const User = require("../models/User")


const verifyMailConfirmed = async (req, res, next) => {
    const id = req.id

    if (!id) {
        throw new UnauthorizedError('You are not authorized')
    }

    const user = await User.findOne({ _id: id }).exec()

    if (!user) {
        throw new UnauthorizedError('No user with this id')
    }

    if (!user.confirmed) {
        throw new Forbidden('You are forbidden from accessing this route. Try verifying your mail')
    }

    next()
}


module.exports = verifyMailConfirmed