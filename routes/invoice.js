const express = require('express')
const router = express.Router()
const { getAllInvoices } = require('../controllers/invoice')


router.route('/').get(getAllInvoices)


module.exports = router