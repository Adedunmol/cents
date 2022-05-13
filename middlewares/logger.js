const { appendFile, readFile, mkdir } = require('fs').promises
const fs = require('fs')
const path = require('path')


const logger = (fileName) => {
    return async (req, res, next) => {
        try {
            const { origin, url, method } = req
            const logData = `${origin}: ${method} ${url}\n\n`
    
            if (!fs.existsSync(path.join(__dirname, '..', 'log'))) {
                const result = await mkdir(path.join(__dirname, '..', 'log'))
            }
    
            const result = await appendFile(path.join(__dirname, '..', 'log', fileName), logData)
            console.log(origin, method, url)
    
            next()
    
        }catch (err) {
            console.log(err)
        }
    }
}

module.exports = logger