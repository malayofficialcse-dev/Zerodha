import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // Hashed!
  cashBalance: { type: Number, default: 100000 },
});

const UserModel = mongoose.model("User", userSchema);
export default UserModel;
