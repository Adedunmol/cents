const fs = require('fs')
const path = require('path')


const filePath = path.join(__dirname, 'invoices', `62854eeacc01f80bde4d6177.pdf`)
console.log(fs.existsSync(filePath))