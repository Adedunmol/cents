const express = require('express')
const router = express.Router()
const { createClient, getAllClients, getClient, deleteClient, updateClient } = require('../controllers/client')
const { createInvoice } = require('../controllers/invoice')


router.route('/').get(getAllClients).post(createClient)
router.route('/:id').get(getClient).delete(deleteClient).patch(updateClient)
router.route('/:id/invoices').post(createInvoice)


module.exports = router