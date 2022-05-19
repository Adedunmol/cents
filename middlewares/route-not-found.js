const {StatusCodes} = require('http-status-codes')

const routeNotFound = async (req, res) => {
    res.status(StatusCodes.NOT_FOUND).send('Route does not exist')
}


module.exports = routeNotFound