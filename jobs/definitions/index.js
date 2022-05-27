const mailDefinition = require('./mail')


const definitions = [mailDefinition]

const allDefinitions = (agenda) => {
    definitions.forEach((definition) => definition(agenda))
}

module.exports = allDefinitions