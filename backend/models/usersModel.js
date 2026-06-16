import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // Hashed!
  cashBalance: { type: Number, default: 0 },   // Starts at 0, credited 1000 upon KYC approval
  kycStatus: { type: String, enum: ["none", "pending", "approved", "rejected"], default: "none" },
  kyc: {
    fullName: { type: String },
    dob: { type: String },
    phone: { type: String },
    pan: { type: String },
    aadhaar: { type: String },
    bankName: { type: String },
    accountNumber: { type: String },
    ifsc: { type: String },
    address: { type: String },
    submittedAt: { type: Date }
  }
});

const UserModel = mongoose.model("User", userSchema);
export default UserModel;
