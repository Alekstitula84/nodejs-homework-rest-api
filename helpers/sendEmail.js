const sgMail = require("@sendgrid/mail");
require("dotenv").config();

const { SG_API_KEY } = process.env;

sgMail.setApiKey(SG_API_KEY);

async function sendEmail(data) {
    const email = {
        ...data,
        from: "pd.mario.ua@gmail.com",
    };
    await sgMail
        .send(email)
        .then(() => console.log("Email send success"))
        .catch((error) => console.log(error.message));
    return true;
}

module.exports = sendEmail;