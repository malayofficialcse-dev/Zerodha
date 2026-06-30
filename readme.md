# Zerodha Clone – Full-Stack Stock Trading Platform

A modern, full-stack stock trading platform inspired by **Zerodha Kite**, built using the MERN Stack. The application provides an intuitive trading experience with portfolio management, watchlists, order placement, and interactive financial dashboards.

> Designed to demonstrate scalable full-stack development, RESTful APIs, authentication, and responsive UI/UX.

---

##  Features

###  User Authentication
- Secure user registration & login
- JWT Authentication
- Protected routes
- Password encryption using bcrypt

###  Dashboard
- Portfolio overview
- Holdings summary
- Positions tracking
- Profit & Loss calculation
- Investment analytics

###  Trading
- Buy & Sell stocks
- Order management
- Watchlist management
- Holdings management
- Portfolio updates

###  Market Analytics
- Interactive charts
- Stock performance visualization
- Market summary
- Price tracking

###  Responsive UI
- Modern Zerodha-inspired interface
- Mobile responsive
- Clean dashboard
- Smooth navigation

---

# 🛠 Tech Stack

## Frontend
- React.js
- React Router
- Axios
- Material UI
- CSS3

## Backend
- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT Authentication
- bcrypt
- Kafkajs
- Zookeper
- Rabbitmq

## Database
- MongoDB Atlas
- Reddis

## Tools
- Git
- GitHub
- Postman
- VS Code
- Docker
- Kubernetes

---

---

# Installation

## Clone Repository

```bash
git clone https://github.com/malayofficialcse-dev/Zerodha.git
```

```bash
cd Zerodha
```

---

## Install Dependencies

### Backend

```bash
cd backend
npm install
```

### Frontend

```bash
cd frontend
npm install
```

---

## Environment Variables

Create a `.env` file inside the backend directory.

```env
PORT=5000

MONGO_URI=your_mongodb_connection_string

JWT_SECRET=your_secret_key

CLIENT_URL=http://localhost:5173
```

---

## Run Backend

```bash
npm run dev
```

---

## Run Frontend

```bash
npm run dev
```

---

# 🔐 Authentication Flow

- User Registration
- User Login
- JWT Token Generation
- Protected API Routes
- Logout

---

# 📦 REST APIs

### Authentication

```
POST /api/auth/register

POST /api/auth/login
```

### Portfolio

```
GET /api/holdings

GET /api/positions
```

### Orders

```
GET /api/orders

POST /api/orders

DELETE /api/orders/:id
```

---

#  Future Enhancements

- Live Stock Market Data
- WebSocket Integration
- Real-Time Price Updates
- Candlestick Charts
- Portfolio Analytics
- Watchlist Synchronization
- Trading History
- Notifications
- Dark Mode
- Docker Deployment
- Kubernetes Deployment

---
#  Project Highlights

- Full-Stack MERN Application
- JWT Authentication
- RESTful APIs
- MongoDB Database
- Responsive Dashboard
- Secure User Authentication
- Modular Folder Structure
- Production Ready Architecture

---

#  Contributing

Contributions are welcome!

1. Fork the repository
2. Create a new branch

```bash
git checkout -b feature/new-feature
```

3. Commit your changes

```bash
git commit -m "Added new feature"
```

4. Push to GitHub

```bash
git push origin feature/new-feature
```

5. Open a Pull Request

---

#  License

This project is developed for educational and portfolio purposes.

---

#  Author

**Malay Maity**

Full Stack Software Engineer

---

⭐ If you found this project useful, consider giving it a Star on GitHub!
