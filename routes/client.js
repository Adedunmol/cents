const express = require('express')
const router = express.Router()
const { createClient, getAllClients, getClient } = require('../controllers/client')

router.route('/').get(getAllClients).post(createClient)
router.route('/:id').get(getClient)

module.exports = router