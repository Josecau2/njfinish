# Project Name
NJCabinates
This project consists of a Node.js backend and a React (Vite) frontend. The frontend is located inside the `frontend/` directory and served as a static build.

---

## 📁 Folder Structure

```
root/
│
├── /                   # Node.js backend code
├── frontend/           # React frontend (Vite)
│   ├── public/
│   ├── src/
│   ├── vite.config.js
│   └── ...
├── .env
└── README.md
```

---

## 🚀 Installation Guide

### Prerequisites

- Node.js (v20.14.0)
- npm (10.7.0)
- MySql

---

## 1️⃣ Backend Setup (Node.js)

1. **Install dependencies**

npm install

2. **Configure environment variables**

Create a `.env` file in the root directory with the following structure:

PORT=8080
DB_HOST=192.168.1.30
DB_USER=
DB_PASSWORD=
DB_PORT=3066
DB_NAME=
JWT_SECRET=

GMAIL_USER=
GMAIL_APP_PASS=

APP_URL=


## 2️⃣ Frontend Setup (React with Vite)

1. **Navigate to frontend folder**

cd frontend


2. **Install frontend dependencies**

npm install


3. **Build the frontend for production**

npm run build

This will create a `dist/` folder in `frontend/`.

## ✅ Running the App

After completing the above steps:

npx nodemon index.js

- Backend will run on `http://localhost:5000`
- Frontend will be served from the same port


## 📦 Build & Deploy

Make sure to rebuild the frontend with `npm run build` inside `frontend/` whenever changes are made. Then restart your Node server.

