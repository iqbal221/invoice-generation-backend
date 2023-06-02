

import bcrypt from "bcryptjs";
import mongoose from "mongoose";

const { Schema } = mongoose;

// Define Form schema
export const FormSchema = new Schema({
  accountholdername: {
    type: String,
    
  },
  mobilenumber:{
    type:String
  },
  acctype:{
    type: String,
    enum: ['Savings', 'Current']
  },
  bankname:{
    type:String
  },
  branchname:{
    type:String
  },
  bankaccnumber: {
    type: String
  },
  ifsc: {
    type: String
  },
  pannumber: {
    type: String
  }
});

// Define Employee schema
export const EmployeeSchema = new Schema({
  refName:{
    type: String,
    required: [true, "Please provide ref name"],
  },
  firstName: {
    type: String,
    required: [true, "Please provide the first name"],
  },
  lastName: {
    type: String,
    required: [true, "Please provide the last name"],
  },
  email: {
    type: String,
    required: [true, "Please provide the email"],
    unique: [true, "Email already exists"],
  },
  password: {
    type: String,
    required: [true, "Please provide a password"],
  },
  admin: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  }
});




export const AdminSchema = new Schema({

  email: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  firstName:{
   type:  String,
  },
  lastName:{
    type : String,
  }
  
})



export const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true
  },
  otp: {
    type: String,
    required: true
  }
});
const newUserId = new mongoose.Types.ObjectId();


export const UserSchema = new Schema({
  _id: mongoose.Types.ObjectId,
  username: {
    type: String,
    required: [true, "Please provide a unique username"],
    unique: [true, "Username already exists"],
  },
  password: {
    type: String,
    required: [true, "Please provide a password"],
  },
  email: {
    type: String,
    required: [true, "Please provide a unique email"],
    unique: [true, "Email already exists"],
  },
  firstName: {
    type: String,
    required: [true, "Please provide your first name"],
  },
  lastName: {
    type: String,
    required: [true, "Please provide your last name"],
  },
  phoneNumber: {
    type: String,
    required: [true, "Please provide a valid phone number"],
  },
  role: { type: String, enum: ['admin', 'employee'], default: 'employee' },
  form: {
    type: FormSchema,
    required: false,
  }
});






const bankDetailsSchema = new mongoose.Schema({
  employeeId:{type:mongoose.Schema.Types.ObjectId, ref: 'employee', required: true},
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true },
  accountholdername: {
    type: String,
    required: true
  },
  mobilenumber: {
    type: String,
    required: true
  },
  acctype: {
    type: String,
  },
  bankname: {
    type: String,
    required: true
  },
  branchname: {
    type: String,
    required: true
  },
  ifsc: {
    type: String,
    required: true
  },
  pannumber: {
    type: String,
    required: true
  },
  bankaccnumber: {
    type: String,
    required: true
  }
});







// UserSchema.virtual('id').get(function() {
//   return this._id.toHexString();
// });

// comparePassword method for employee schema
// EmployeeSchema.methods.comparePassword = async function (newPassword) {
//   return await bcrypt.compare(newPassword, this.password);
// };


EmployeeSchema.methods.updatePassword = async function (newPassword) {
  this.password = await bcrypt.hash(newPassword, 10);
  await this.save();
};
export const User = mongoose.model("User", UserSchema);
export const Form = mongoose.model("Form", FormSchema);
// export default User;
export const Employee = mongoose.model("Employee", EmployeeSchema);
export const Admin = mongoose.model("Admin", AdminSchema);
export const OTP = mongoose.model("OTP", otpSchema);
export const BankDetails = mongoose.model('BankDetails', bankDetailsSchema);

export default User;
