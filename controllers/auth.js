const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const User = require('../models/User')
const { BadRequestError, NotFound, UnauthorizedError, Forbidden } = require('../errors')
const { StatusCodes } = require('http-status-codes')
const ADMIN_LIST = require('../config/admin_list')


const register = async (req, res) => {
    const { fullName, email, password } = req.body

    if (!fullName || !email || !password) {
        throw new BadRequestError('Body should include fullName, email and password')
    }

    const user = await User.findOne({ email })

    if (user) {
        throw new NotFound(`${email} already exists`)
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    if (ADMIN_LIST.includes(email)) {
        const result = await User.create({
            fullName,
            email,
            roles: {
                Admin: 3001,
                User: 1984,
                Moderator: 2150
            },
            password: hashedPassword
        })
        return res.status(StatusCodes.CREATED).json(result)
    }else {
        const result = await User.create({
            fullName,
            email,
            password: hashedPassword
        })
        return res.status(StatusCodes.CREATED).json(result)
    }
}


const login = async (req, res) => {
    const { email, password } = req.body
    const cookie = req.cookies
    const refreshToken = cookie?.jwt

    if (!email || !password) {
        throw new BadRequestError('Please Provide email and password')
    }

    const user = await User.findOne({ email }).exec()

    if (!user) {
        throw new NotFound(`No user found with this email: ${email}`)
    }

    const match = await bcrypt.compare(password, user.password)
    
    if (match) {
        roles = Object.values(user.roles)

        const accessToken = jwt.sign(
            {
                UserInfo: {
                    id: user._id,
                    email: user.email,
                    roles: roles
                }
            },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: '15m' }
        )

        const newRefreshToken = jwt.sign(
            {
                email: user.email
            },
            process.env.REFRESH_TOKEN_SECRET,
            { expiresIn: '1d' }
        )
        
        let newRefreshTokenArray = !cookie?.jwt ? user.refreshToken : user.refreshToken.filter(token => token !== cookie?.jwt)

        if (cookie?.jwt) {
            res.clearCookie('jwt', { maxAge: 24 * 60 * 60 * 1000, httpOnly: true, sameSite: 'None'})

            const foundToken = await User.findOne({ refreshToken }).exec()

            if (!foundToken) {
                console.log('Token reuse detected')
                newRefreshTokenArray = []
            }

        }

        user.refreshToken = [...newRefreshTokenArray, newRefreshToken]
        const result = await user.save()

        res.cookie('jwt', newRefreshToken, { maxAge: 24 * 60 * 60 * 1000, httpOnly: true, sameSite: 'None' })
        return res.status(StatusCodes.OK).json({ accessToken })
    }

    throw new UnauthorizedError('Invalid credentials')
}


const refreshToken = async (req, res) => {
    const cookie = req.cookies
    

    if (!cookie?.jwt) {
        throw new UnauthorizedError('You are not authorized to access this route')
    }

    const refreshToken = cookie.jwt
    console.log(`cookie token: ${refreshToken}`)
    res.clearCookie('jwt', {maxAge: 24 * 60 * 60 * 1000, httpOnly: true, sameSite: 'None'})

    const user = await User.findOne({ refreshToken }).exec()

    //reuse detected
    if (!user) {
        
        jwt.verify(
            refreshToken,
            process.env.REFRESH_TOKEN_SECRET,
            async (err, data) => {
                if (err) {
                    throw new Forbidden('bad token for reuse')
                }

                const user = await User.findOne({ email: data.email }).exec()
                
                if (user) {
                    user.refreshToken = []
                }
            }
        )

        throw new UnauthorizedError('Token reuse')
    }

    console.log(user)
    let newRefreshTokenArray = user.refreshToken.filter(token => token !== refreshToken)

    jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET,
        async (err, data) => {
            if (err) {
                user.refreshToken = [...newRefreshTokenArray]
                const result =  await user.save()
            }
            if (err || data.email !== user.email) {
                throw new Forbidden('Bad Token')
            }

            roles = Object.values(user.roles)

            const accessToken = jwt.sign(
                {
                    UserInfo: {
                        id: user._id,
                        email: user.email,
                        roles: roles
                    }
                },
                process.env.ACCESS_TOKEN_SECRET,
                { expiresIn: '1d' }
            )

            const newRefreshToken = jwt.sign(
                {
                    email: user.email
                },
                process.env.REFRESH_TOKEN_SECRET,
                { expiresIn: '1d' }
            )
            
            
            user.refreshToken = [...newRefreshTokenArray, newRefreshToken]
            const result = await user.save()

            res.cookie('jwt', newRefreshToken, {maxAge: 24 * 60 * 60 * 1000, httpOnly: true, sameSite: 'None'})

            return res.status(StatusCodes.OK).json({ accessToken })
        }
    )
}


const logout = async (req, res) => {
    // clear tokens in frontend
    const cookie = req.cookies

    if (!cookie?.jwt) {
        return res.sendStatus(StatusCodes.NO_CONTENT)
    }

    const refreshToken = cookie.jwt
    const user = await User.findOne({ refreshToken }).exec()

    if (!user) {
        res.clearCookie('jwt', {maxAge: 24 * 60 * 60 * 1000, httpOnly: true, sameSite: 'None'})
        return res.sendStatus(StatusCodes.NO_CONTENT)
    }

    user.refreshToken = user.refreshToken.filter(token => token !== refreshToken)
    res.clearCookie('jwt', {maxAge: 24 * 60 * 60 * 1000, httpOnly: true, sameSite: 'None'})

    const result = await user.save()

    return res.sendStatus(StatusCodes.NO_CONTENT)
}


const changePassword = async (req, res) => {
    const email = req.user
    const { oldPassword, newPassword } = req.body

    if (!oldPassword || !newPassword) {
        throw new BadRequestError('Body must include oldPassword and newPassword')
    }

    const user = await User.findOne({ email }).exec()

    const match = await bcrypt.compare(oldPassword, user.password)

    if (match) {
        const hashedPassword = await bcrypt.hash(newPassword, 10)
        user.password = hashedPassword
        const result = await user.save()
        
        return res.status(StatusCodes.OK).json({ message: 'Password updated' })
    }
    
    throw new UnauthorizedError('Invalid credentials')
}


const forgotPassword = async (req, res) => {

}


module.exports = {
    login,
    register,
    refreshToken,
    logout,
    changePassword,
    forgotPassword
}