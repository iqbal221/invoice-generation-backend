import express from "express";
import { Employee, Admin } from "../model/User.model.js";
import nodemailer from "nodemailer"
import dotenv from 'dotenv';
dotenv.config();

import jwt from 'jsonwebtoken';
import cookie  from "cookie-parser";
import { BankDetails } from "../model/User.model.js";
import mongoose from "mongoose";
import bcrypt from "bcryptjs"
import cryptoRandomString from "crypto-random-string";
import AWS from "aws-sdk";
import multer from 'multer';
import {check , validationResult} from "express-validator"
import otpGenerator from "otp-generator"
import session from "express-session";
import { MemoryStore } from "express-session";
import bodyParser from "body-parser";

const config = {
  JWT_SECRET: process.env.JWT_SECRET,
  EMAIL: process.env.EMAIL,
  PASSWORD: process.env.PASSWORD,
  ATLAS_URI: process.env.ATLAS_URI,
  adminemail: process.env.adminemail,
clingaccountsemail :process.env.clingaccountsemail,
  AWS: {
      bucketName: process.env.AWS_BUCKET_NAME,
      region: process.env.AWS_REGION,
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  }
};

const router2 = express.Router();
const sessionSecret = cryptoRandomString({ 
  length: 6, 
  type: 'numeric' 
});


// Add config variable declaration
router2.use(session({
  secret: sessionSecret,
  resave: false,
  saveUninitialized: true,
  cookie: { secure: true },
  store: new MemoryStore({
    checkPeriod: 86400000 // prune expired entries every 24h
  })
}));

router2.post('/addBankDetails', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1] || req.cookies.token;
  if (!token) {
    return res.status(401).send('Unauthorized');
  }

  try {
    const decodedToken = jwt.verify(token, config.JWT_SECRET, { algorithm: 'HS256' });
    const employeeId = decodedToken.employeeId;
    const adminId = decodedToken.adminId;
  

    // Find the existing bank details object for the employee
    let bankDetails = await BankDetails.findOne({ employeeId: employeeId });
    if (bankDetails) {
      // Update the existing bank details object with the new form data
      bankDetails.accountholdername = req.body.accountholdername;
      bankDetails.mobilenumber = req.body.mobilenumber;
      bankDetails.acctype = req.body.acctype;
      bankDetails.bankname = req.body.bankname;
      bankDetails.branchname = req.body.branchname;
      bankDetails.ifsc = req.body.ifsc;
      bankDetails.pannumber = req.body.pannumber;
      bankDetails.bankaccnumber = req.body.bankaccnumber;
    } else {
      // Create a new bank details object and populate it with form data
      bankDetails = new BankDetails({
        employeeId: employeeId,
        adminId: adminId,
        accountholdername: req.body.accountholdername,
        mobilenumber: req.body.mobilenumber,
        acctype: req.body.acctype,
        bankname: req.body.bankname,
        branchname: req.body.branchname,
        ifsc: req.body.ifsc,
        pannumber: req.body.pannumber,
        bankaccnumber: req.body.bankaccnumber,
      });
    }

    // Save the bank details object to the database
    const savedBankDetails = await bankDetails.save();
    console.log("Bank details added/updated successfully. Employee ID:", employeeId, "Admin ID:", adminId, "Form data:", savedBankDetails);
    res.send(savedBankDetails);
  } catch (err) {
    console.log("Error adding/updating bank details:", err.message);
    console.log('Error decoding JWT token:', err.message);
    return res.status(401).send('Unauthorized');
  }
});
//>>>>>>>>>>>>>>>>>>>>>>>>>>GET API are here  <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<//


router2.get("/bankDetails", async (req, res) => {
  // Get the JWT token from the request headers or cookies
  const token = req.headers.authorization?.split(' ')[1] || req.cookies.token;
  if (!token) {
    return res.status(401).send('Unauthorized');
  }

  try {
    // Verify the JWT token and extract the employee ID
    const decodedToken = jwt.verify(token, config.JWT_SECRET, { algorithm: 'HS256' });
    const employeeId = decodedToken.employeeId;

    // Find the bank details for the employee with the matching ID
    const bankDetails = await BankDetails.findOne({ employeeId });
    if (!bankDetails) {
      console.log("Bank details not found for employee ID:", employeeId);
      return res.status(404).json({ error: "Bank details not found" });
    }

    // Return the bank details as a response
    console.log("Bank details retrieved successfully for employee ID:", employeeId);
    res.send(bankDetails);
  } catch (err) {
    console.log("Error retrieving bank details:", err.message);
    console.log('Error decoding JWT token:', err.message);
    return res.status(401).send('Unauthorized');
  }
});




router2.get("/bankDetailsadmin", async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1] || req.cookies.token;
  if (!token) {
    return res.status(401).send('Unauthorized');
  }

  try {
    const decodedToken = jwt.verify(token, config.JWT_SECRET, { algorithm: 'HS256' });
    const adminId = decodedToken.adminId;

    // Check if the admin with the given ID exists
    const admin = await Admin.findById(adminId);
    if (!admin) {
      console.log("Admin not found with ID:", adminId);
      return res.status(404).json({ error: "Admin not found" });
    }

    // Retrieve bank details of all employees
    const bankDetails = await BankDetails.find();

    // Return the bank details as a response
    console.log("Bank details retrieved successfully");
    res.send(bankDetails);
  } catch (err) {
    console.log("Error retrieving bank details:", err.message);
    console.log('Error decoding JWT token:', err.message);
    return res.status(401).send('Unauthorized');
  }
});













//>>>>>>>>>>>>>>>>>>>>>>>>>>PUT API are here  <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<//




const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASSWORD
}
});




function checkRequiredFields(obj, fields) {
  return fields.every(field => Object.prototype.hasOwnProperty.call(obj, field) && obj[field])
    && obj.newPassword === obj.confirmNewPassword;
}


// function checkRequiredFields(obj, fields) {
//   return fields.every(field => Object.prototype.hasOwnProperty.call(obj, field) && obj[field]);
// }

router2.put('/createEmployees', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1] || req.cookies.token;
    const { newPassword, confirmNewPassword, email } = req.body;
    let employee;

    if (token) {
      // if token is present
      const tokenData = jwt.verify(token, config.JWT_SECRET, { algorithm: 'HS256' });
      const adminId = tokenData.adminId;
      const employeeId = tokenData.employeeId;
      const email = tokenData.email;

     

      employee = await Employee.findById(employeeId);
      if (!employee) {
        throw new Error('Employee not found');
      }
    } else if (email) {
      // if token is not present, but email is provided
      employee = await Employee.findOne({ email });
      if (!employee) {
        throw new Error('No account found with the provided email');
      }
    } else {
      throw new Error('Authorization header or email is missing');
    }

    if (!checkRequiredFields(req.body, ['newPassword', 'confirmNewPassword'])) {
      throw new Error('newPassword and confirmNewPassword are required');
    }
    if (newPassword !== confirmNewPassword) {
      throw new Error('newPassword and confirmNewPassword do not match');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    employee.password = passwordHash;
    await employee.save();
    console.log('Employee password reset successful');

    // Send notification to employee's email using NodeMailer
    const mailOptions = {
      from: "surendrawankhade1973@gmail.com",
      to: employee.email,
      subject: 'Your password has been reset for Cling Multi Solution',
      html: `<p>Hello ${employee.firstName},</p>
             <p>Your password has been successfully reset for your Cling Multi Solution account.</p>
             <p>Please login to your account with your new password and reset it again

               <p>Thank you!</p>`
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log('Error:', error.message);
      } else {
        console.log('Email sent:', info.response);
      }
    });

    res.send({ message: 'Employee password reset successful' });

  } catch (err) {
    console.log('Error:', err.message);
    res.status(400).send({ message: err.message });
  }
});





// POST endpoint to send OTP for password reset
let email = null;
let otp = null;
let otpExpiry = null;

router2.post('/forgot-password', [
  check('email').isEmail().withMessage('Invalid email address'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email: reqEmail } = req.body;

    // Check if employee account with provided email exists
    const employee = await Employee.findOne({ email: reqEmail  });
if (!employee) {
  return res.status(404).json({ error: 'Employee account not found' });
}

   // Check if employee account is active
   if (employee.status === 'inactive') {
    return res.status(403).json({ error: 'Employee account is inactive. Please contact support.' });
  }
    // Generate OTP and send to employee's email
    const otpValue = Math.floor(Math.random() * 900000) + 100000;
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD
    }
    });
    const mailOptions = {
      from: process.env.EMAIL_USERNAME,
      to: reqEmail,
      subject: 'Password reset OTP',
      text: `Your OTP is ${otpValue}. Please use this to reset your password.`,
    };
    await transporter.sendMail(mailOptions);

    // Store OTP and email in variables for validation
    email = reqEmail;
    otp = otpValue;
    otpExpiry = Date.now() + 600000; // OTP expires after 10 minutes

    return res.status(200).json({ message: 'OTP sent to email' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST endpoint to verify OTP and generate temporary JWT token
// POST endpoint to verify OTP and generate temporary JWT token
router2.post('/verify-otp', [
  check('email').isEmail().withMessage('Invalid email address'),
  check('otp').isNumeric().withMessage('OTP must be numeric'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email: reqEmail, otp: reqOtp } = req.body;

    // Check if OTP has expired or email and OTP do not match stored values
    if (!(otp === reqOtp && otpExpiry > Date.now() && email === reqEmail)) {
      return res.status(401).json({ error: 'Invalid OTP or email' });
    }

    // Generate temporary JWT token
    const token = jwt.sign({ email, isAdmin: false }, config.JWT_SECRET, { expiresIn: '15m' });

    // Set HTTP-only cookie with JWT token
    res.cookie('token', token, { httpOnly: true, secure: true, sameSite: 'strict' });
    res.send(token)
        // Clear stored OTP and email values
    email = null;
    otp = null;
    otpExpiry = null;

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST endpoint to reset password using temporary JWT token
router2.post('/reset-password', [
  check('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Extract JWT token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const [bearer, token] = authHeader.split(' ');
    if (!bearer || !token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    if (bearer !== 'Bearer') {
      return res.status(401).json({ error: 'Invalid Authorization header format' });
    }

    // Verify JWT token
    const decode = jwt.verify(token, config.JWT_SECRET);
    // Update employee's password
    const { password } = req.body;
    const employee = await Employee.findOne({ email: decode.email });
    employee.password = await bcrypt.hash(password, 10);
    await employee.save();
    return res.status(200).json({ message: 'Password reset successful' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Set up AWS S3 configuration
AWS.config.update(config.AWS);


// Create an S3 instance
const s3 = new AWS.S3();

// Set up Multer middleware to handle file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage });







const adminEmail = process.env.adminemail
const clingAccountsEmail =  process.env.clingaccountsemail
// Define a function to fetch a PDF file from S3 and send it as an email attachment
async function sendPdfByEmail(pdfKey, recipientEmail,adminEmail,clingAccountsEmail, message) {
  try {
    // Fetch the PDF file from S3
    const s3Params = {
      Bucket: 'clinginvoice',
      Key: pdfKey,
    };
    const pdfObject = await s3.getObject(s3Params).promise();
    if (!pdfObject) {
      throw new Error(`PDF file not found: ${pdfKey}`);
    }
    // Set up the email options
    const mailOptions = {
      from: process.env.EMAIL,
      to: recipientEmail ,
       cc: adminEmail,clingAccountsEmail, 
      subject: 'PDF attachment',
      text: message,
      attachments: [
        {
          filename: pdfKey,
          content: pdfObject.Body,
        },
      ],
    };

    // Send the email
    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent: ${info.messageId}`);
  } catch (error) {
    console.error(error);
  }
}

// Define the API endpoint
router2.post('/send-pdf', upload.single('pdf'), async (req, res) => {
  try {
    const pdfKey = req.body.pdfName;
    const recipientEmail = req.body.email;
    const message = req.body.message;
    
    await sendPdfByEmail(pdfKey, recipientEmail,adminEmail,clingAccountsEmail, message);
    res.status(200).send('Email sent successfully');
      

  } catch (error) {
    console.error(error);
    res.status(500).send('Error sending email');
  }
});



router2.put('/employees/:id/inactive', async (req, res) => {
  try {
    const { id } = req.params;
    const authorizationHeader = req.headers.authorization;
    if (!authorizationHeader) {
      throw new Error('Authorization header is missing');
    }

    const token = authorizationHeader.split(' ')[1];
    const tokenData = jwt.verify(token, config.JWT_SECRET, { algorithm: 'HS256' });
    const adminId = tokenData.adminId;

    const admin = await Admin.findById(adminId);
    if (!admin) {
      throw new Error('Admin not found');
    }

    const employee = await Employee.findById(id);
    if (!employee) {
      throw new Error('Employee not found');
    }

    employee.status = 'inactive';
    await employee.save();

    res.send({ message: 'Employee status updated successfully' });

  } catch (err) {
    console.log('Error:', err.message);
    res.status(400).send({ message: err.message });
  }
});



router2.put('/employees/:id/active', async (req, res) => {
  try {
    const { id } = req.params;
    const authorizationHeader = req.headers.authorization;
    if (!authorizationHeader) {
      throw new Error('Authorization header is missing');
    }

    const token = authorizationHeader.split(' ')[1];
    const tokenData = jwt.verify(token, config.JWT_SECRET, { algorithm: 'HS256' });
    const adminId = tokenData.adminId;

    const admin = await Admin.findById(adminId);
    if (!admin) {
      throw new Error('Admin not found');
    }

    const employee = await Employee.findById(id);
    if (!employee) {
      throw new Error('Employee not found');
    }

    employee.status = 'active';
    await employee.save();

    res.send({ message: 'Employee status updated successfully' });

  } catch (err) {
    console.log('Error:', err.message);
    res.status(400).send({ message: err.message });
  }
});

// employee assign person update

router2.put('/employees/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const newInfo = req.body;

    console.log(newInfo)

    const authorizationHeader = req.headers.authorization;
    if (!authorizationHeader) {
      throw new Error('Authorization header is missing');
    }

    const token = authorizationHeader.split(' ')[1];
    const tokenData = jwt.verify(token, config.JWT_SECRET, { algorithm: 'HS256' });
    const adminId = tokenData.adminId;

    const admin = await Admin.findById(adminId);
    if (!admin) {
      throw new Error('Admin not found');
    }

    const employee = await Employee.findById(id);
    console.log(employee)
    if (!employee) {
      throw new Error('Employee not found');
    }

    const result = await Employee.updateOne({_id:id},{$set:newInfo})
    console.log(result)
    // employee.refName = refName;
    // await employee.save();

    res.send({status:"success", data:result, message: 'Employee assign to person successfully' });
    console.log(employee)
  } catch (err) {
    console.log('Error:', err.message);
    res.status(400).send({ message: err.message });
  }
});


export default router2;
