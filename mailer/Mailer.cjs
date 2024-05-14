const nodemailer = require("nodemailer");
const fs = require('fs');
require('dotenv').config();

const transporter = nodemailer.createTransport({
    service: "gmail",
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
    },
});

function sendConfirmation(recipient, link) {
    const htmlContent = fs.readFileSync('./mailer/ConfirmReset.html', 'utf8').replace('#link', link);
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: recipient,
        subject: "Password Reset Confirmation",
        html: htmlContent
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error("Error sending email: ", error);
        } else {
            console.log("Email sent: ", info.response);
        }
    });
}

function sendPatientEmail(recipient, patient) {
    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD,
        },
    });

    let htmlContent = fs.readFileSync('./mailer/NewPatient.html', 'utf8');
    Object.keys(patient).forEach(key => {
        htmlContent = htmlContent.replace(new RegExp(`#${key}`, 'g'), patient[key]);
    });

    let mailOptions = {
        from: process.env.EMAIL_USER,
        to: recipient,
        subject: 'New Patient Created',
        html: htmlContent
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error("Error sending email: ", error);
        } else {
            console.log("Email sent: ", info.response);
        }
    });
}

function sendAppointmentEmail(recipient, appointment) {
    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD,
        },
    });

    let htmlContent = fs.readFileSync('./mailer/NewAppointment.html', 'utf8');
    Object.keys(appointment).forEach(key => {
        htmlContent = htmlContent.replace(new RegExp(`#${key}`, 'g'), appointment[key]);
    });

    let mailOptions = {
        from: process.env.EMAIL_USER,
        to: recipient,
        subject: 'New Appointment Scheduled',
        html: htmlContent
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error("Error sending email: ", error);
        } else {
            console.log("Email sent: ", info.response);
        }
    });
}

function sendLabOrderEmail(recipient, labOrder) {
    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD,
        },
    });

    let htmlContent = fs.readFileSync('./mailer/NewLab.html', 'utf8');
    Object.keys(labOrder).forEach(key => {
        htmlContent = htmlContent.replace(new RegExp(`#${key}`, 'g'), labOrder[key]);
    });

    let mailOptions = {
        from: process.env.EMAIL_USER,
        to: recipient,
        subject: 'New Lab Order',
        html: htmlContent
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error("Error sending email: ", error);
        } else {
            console.log("Email sent: ", info.response);
        }
    });
}

function sendPrescriptionEmail(recipient, prescription) {
    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD,
        },
    });

    let htmlContent = fs.readFileSync('./mailer/NewPrescription.html', 'utf8');
    Object.keys(prescription).forEach(key => {
        htmlContent = htmlContent.replace(new RegExp(`#${key}`, 'g'), prescription[key]);
    });

    let mailOptions = {
        from: process.env.EMAIL_USER,
        to: recipient,
        subject: 'New Prescription Order',
        html: htmlContent
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error("Error sending email: ", error);
        } else {
            console.log("Email sent: ", info.response);
        }
    });
}

module.exports = { sendConfirmation, sendPatientEmail, sendAppointmentEmail, sendLabOrderEmail };