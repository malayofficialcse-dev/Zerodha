import jwt from "jsonwebtoken";
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";

export default function auth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "No token" });
  const token = authHeader.replace("Bearer ", "");
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}

// import jwt from "jsonwebtoken";
// import User from "../models/usersModel.js";

// const auth = async (req, res, next) => {
//   const token = req.headers.authorization?.split(" ")[1];
//   if (!token) return res.status(401).json({ error: "No token" });
//   try {
//     const decoded = jwt.verify(token, "YOUR_SECRET");
//     req.user = await User.findById(decoded.id);
//     if (!req.user) return res.status(401).json({ error: "User not found" });
//     next();
//   } catch (err) {
//     res.status(401).json({ error: "Invalid token" });
//   }
// };
// export default auth;
