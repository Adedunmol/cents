const express = require('express')
const router = express.Router()
const { login, 
        register, 
        refreshToken, 
        logout, 
        changePassword, 
        confirmMail, 
        sendConfirmationMail, 
        forgotPassword,
        resetPassword
    } = require('../controllers/auth')
const verifyJWT = require('../middlewares/verifyJWT')


router.route('/login').post(login)
router.route('/logout').get(logout)
router.route('/register').post(register)
router.route('/refresh-token').get(refreshToken)
router.route('/change-password').patch(verifyJWT, changePassword)
router.route('/confirm-mail/:token').get(confirmMail)
router.route('/resend-confirmation-mail').get(verifyJWT, sendConfirmationMail)
router.route('/forgot-password').post(forgotPassword)
router.route('/reset-password/:token').patch(resetPassword)

module.exports = router