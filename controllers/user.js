const { StatusCodes } = require('http-status-codes')
const User = require('../models/User')


const updateUserInfo = async (req, res) => {
    const userId = req.id

    const user = await User.findOneAndUpdate({ _id: userId }, req.body, { new: true, runValidators: true }).select('-roles -password')

    return res.status(StatusCodes.OK).json({ user })
}


module.exports = updateUserInfo