const express = require('express')
const router = express.Router()
const { changePassword } = require('../controllers/auth')

router.route('/').patch(changePassword)

module.exports = router