# Backend Setup Guide - Quick Start

## ✅ Step 1: Create Telegram Bot

1. Open Telegram and search for **@BotFather**
2. Send the command: `/newbot`
3. Follow the instructions to name your bot
4. Copy the **bot token** you receive (looks like: `1234567890:ABCdefGhIjKlmNoPQRsTUVwxyZ`)
5. Open `backend/.env` file
6. Replace `YOUR_BOT_TOKEN_HERE` with your actual token

## ✅ Step 2: Setup MongoDB (Choose One)

### Option A: MongoDB Atlas (Recommended - Free & Cloud)

1. Go to https://cloud.mongodb.com/
2. Sign up / Sign in
3. Click "Build a Database"
4. Choose **FREE** tier (M0)
5. Select a cloud provider and region (any)
6. Click "Create"
7. Set up a database user:
   - Username: `petamini`
   - Password: Create a secure password
8. Add your IP address (or use `0.0.0.0/0` for testing)
9. Click "Connect" → "Connect your application"
10. Copy the connection string
11. In `backend/.env`, replace the `MONGODB_URI` with your connection string
12. Replace `<password>` with your actual password

### Option B: Local MongoDB

1. Download from https://www.mongodb.com/try/download/community
2. Install MongoDB
3. In `backend/.env`, use: `MONGODB_URI=mongodb://localhost:27017`

## ✅ Step 3: Update .env File

Open `backend/.env` and make sure you have:

```env
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGhIjKlmNoPQRsTUVwxyZ  # Your actual token
MONGODB_URI=mongodb+srv://petamini:yourpassword@cluster.mongodb.net/?retryWrites=true&w=majority
DATABASE_NAME=petamini
PORT=8080
ENVIRONMENT=development
FRONTEND_URL=http://localhost:5173
```

## ✅ Step 4: Initialize Database

Run this command to create collections and add sample Pokemon:

```powershell
go run scripts/init_db.go
```

## ✅ Step 5: Start Backend Server

```powershell
go run main.go
```

You should see:

```
2025/10/20 13:13:18 Successfully connected to MongoDB
2025/10/20 13:13:18 Server starting on :8080
```

## ✅ Step 6: Test the Backend

Open a new terminal and run:

```powershell
curl http://localhost:8080/health
```

Should return: `{"status":"ok"}`

---

## 🚀 You're Ready!

Now you can:

1. Start the frontend: `npm run dev` (in the root folder)
2. Open the app in Telegram WebApp
3. Click "Buy" on a Pokemon card
4. Complete payment with Telegram Stars

---

## 🐛 Troubleshooting

**Error: "TELEGRAM_BOT_TOKEN is required"**

- Make sure `.env` file exists in `backend/` folder
- Check that `TELEGRAM_BOT_TOKEN` has your actual token (no quotes needed)

**Error: "Failed to connect to MongoDB"**

- Check your `MONGODB_URI` is correct
- Make sure your IP is whitelisted in MongoDB Atlas
- Verify username/password are correct

**Error: "Port 8080 already in use"**

- Change `PORT=8081` in `.env` file
- Update `VITE_BACKEND_URL` in frontend `.env.local` to match
