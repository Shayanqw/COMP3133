# COMP3133 Lab Test 1 – Chat App (Portfolio Build)

Real-time chat application with:
- Signup + Login (MongoDB + password hashing)
- LocalStorage session (JWT stored in localStorage)
- Join/Leave predefined rooms
- Room-based group chat (Socket.IO)
- Private 1-to-1 chat (Socket.IO)
- Typing indicators (room + private)
- MongoDB persistence for users + group messages + private messages

## Tech
Backend: Express, Socket.IO, Mongoose  
Frontend: HTML5, CSS, Bootstrap, fetch, jQuery

## Setup

1) Install dependencies
```bash
npm install
```

2) Create `.env`
```bash
cp .env.example .env
```
Update `MONGO_URI` and `JWT_SECRET`.

3) Start MongoDB
- Local: ensure `mongod` is running
- Or point `MONGO_URI` to MongoDB Atlas

4) Run
```bash
npm run dev
# or
npm start
```

5) Open in browser
- Login: `http://localhost:3000/view/login.html`
- Signup: `http://localhost:3000/view/signup.html`
