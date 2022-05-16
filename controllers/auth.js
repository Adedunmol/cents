const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const User = require('../models/User')
const { BadRequestError, NotFound, UnauthorizedError, Forbidden } = require('../errors')
const { StatusCodes } = require('http-status-codes')
const ADMIN_LIST = require('../config/admin_list')
const sendMail = require('../config/mail')


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

    //generate token for confirmation mail
    const token = jwt.sign({ email }, process.env.SECRET_KEY, { expiresIn: '15m' })

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

        mailSubject = 'Confirmation Mail From Cents'
        text = `Here is your confirmation link http://localhost:3000/api/v1/auth/confirm-mail/${token}`
        html = `<p>Here is your confirmation link <a href=http://localhost:3000/api/v1/auth/confirm-mail/${token}> Confirm Mail </a> </p>`

        sendMail(email, mailSubject, text, html)

        return res.status(StatusCodes.CREATED).json(result)

    }else {
        const result = await User.create({
            fullName,
            email,
            password: hashedPassword
        })

        mailSubject = 'Confirmation Mail From Cents'
        text = `Here is your confirmation link http://localhost:3000/api/v1/auth/confirm-mail/${token}`
        html = `<p>Here is your confirmation link <a href=http://localhost:3000/api/v1/auth/confirm-mail/${token}> Confirm Mail </a> </p>`

        sendMail(email, mailSubject, text, html)

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
        return res.status(StatusCodes.OK).json({ accessToken, expiresIn: 15 * 60 * 1000 })
    }

    throw new UnauthorizedError('Invalid credentials')
}


const refreshToken = async (req, res) => {
    const cookie = req.cookies
    

    if (!cookie?.jwt) {
        throw new UnauthorizedError('You are not authorized to access this route')
    }

    const refreshToken = cookie.jwt
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

            return res.status(StatusCodes.OK).json({ accessToken, expiresIn: 15 * 60 * 1000 })
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


const confirmMail = async (req, res) => {
    const { token } = req.params

    if (!token) {
        throw new BadRequestError('No token with url')
    }

    jwt.verify(
        token,
        process.env.SECRET_KEY,
        async (err, data) => {
            if (err) {
                return res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Bad token' })
            }
            const email = data.email

            const user = await User.findOne({ email }).exec()

            if (!user) {
                throw new UnauthorizedError('Please check the token you are sending')
            }

            if (user.confirmed) {
                return res.status(StatusCodes.OK).json({ message: 'User already confirmed' })
            }

            user.confirmed = true
            const result = await user.save()

            return res.status(StatusCodes.OK).json({ message: 'User confirmed' })
        }
    )
}


const sendConfirmationMail = async (req, res) => {
    const email = req.user

    if (!email) {
        throw new UnauthorizedError('You are not allowed to access this route')
    }

    const token = jwt.sign({ email }, process.env.SECRET_KEY, { expiresIn: '15m' })

    mailSubject = 'Confirmation Mail From Cents'
    text = `Here is your confirmation link http://localhost:3000/api/v1/auth/confirm-mail/${token}`
    html = `<p>Here is your confirmation link <a href=http://localhost:3000/api/v1/auth/confirm-mail/${token}> Confirm Mail </a> </p>`

    sendMail(email, mailSubject, text, html)

    return res.status(StatusCodes.OK).json({ message: 'mail has been sent' })
}


const forgotPassword = async (req, res) => {
    const { email } = req.body

    if (!email) {
        throw new BadRequestError('Body must include email')
    }

    const user = User.findOne({ email }).exec()

    if (!user) {
        throw new NotFound(`No user with email: ${email}`)
    }

    const token = jwt.sign({ email }, process.env.SECRET_KEY, { expiresIn: '15m' })

    mailSubject = 'Forgot Mail From Cents'
    text = `Here is your forgot password link http://localhost:3000/api/v1/auth/reset-password/${token}`
    html = `<p>Here is your forgot password link <a href=http://localhost:3000/api/v1/auth/reset-password/${token}> Forgot Password </a> </p>`

    sendMail(email, mailSubject, text, html)

    return res.status(StatusCodes.OK).json({ message: 'mail has been sent' })
}

const resetPassword = async (req, res) => {
    const { token } = req.params
    const { password } = req.body

    if (!token) {
        throw new Forbidden('No token with URL')
    }

    jwt.verify(
        token,
        process.env.SECRET_KEY,
        async (err, data) => {
            if (err) {
                throw new UnauthorizedError('Bad token')
            }

            const email = data.email
            const user = await User.findOne({ email }).exec()

            if (!user) {
                throw new UnauthorizedError('No user with this email')
            }

            const hashedPassword = await bcrypt.hash(password, 10)
            user.password = hashedPassword

            const result = await user.save()

            return res.status(StatusCodes.OK).json({ message: 'password has been reset' })
        }
    )
}


module.exports = {
    login,
    register,
    refreshToken,
    logout,
    changePassword,
    forgotPassword,
    confirmMail,
    sendConfirmationMail,
    resetPassword
}