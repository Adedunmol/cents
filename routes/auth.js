const express = require('express')
const router = express.Router()
const { login, register, refreshToken, logout, changePassword } = require('../controllers/auth')
const verifyJWT = require('../middlewares/verifyJWT')


router.route('/login').post(login)
router.route('/logout').get(logout)
router.route('/register').post(register)
router.route('/refresh-token').get(refreshToken)
router.route('/change-password').patch(verifyJWT, changePassword)

module.exports = router