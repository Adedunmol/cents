const express = require('express')
const router = express.Router()
const updateUserInfo = require('../controllers/user')

router.route('/update').patch(updateUserInfo)

module.exports = router