const { google } = require('googleapis')
const nodemailer = require('nodemailer')
const path = require('path')

const oAuth2Client = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, process.env.GOOGLE_REDIRECT_URI)

oAuth2Client.setCredentials({refresh_token: process.env.GOOGLE_REFRESH_TOKEN})

const sendMail = async (to, subject, text, html, invoice) => {
    
    const googleAccessToken = oAuth2Client.getAccessToken()

    const transport = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            type: 'OAuth2',
            user: process.env.ADMIN,
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
            accessToken: googleAccessToken
        }
    })

    const mailOptions = {
        from: `Cents 📧 ${process.env.ADMIN}`,
        to: to,
        subject: subject,
        text: text,
        html: html,
        attachments: invoice ? [{
            filename: `${String(invoice._id)}.pdf`,
            path: path.join(__dirname, '..', 'invoices', `${String(invoice._id)}.pdf`),
            contentType: 'application/pdf'
        }] : ''
    }

    const result = await transport.sendMail(mailOptions)
    
}


module.exports = sendMail