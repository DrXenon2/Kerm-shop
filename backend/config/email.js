const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransporter({
    service: process.env.EMAIL_SERVICE,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const sendEmail = async (to, subject, html) => {
    try {
        const result = await transporter.sendMail({
            from: `"K-SHOP" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html
        });
        
        console.log('Email envoyé à:', to);
        return result;
    } catch (error) {
        console.error('Erreur envoi email:', error);
        throw error;
    }
};

module.exports = { sendEmail };
