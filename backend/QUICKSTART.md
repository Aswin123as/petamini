# 🚀 Quick Start: MongoDB Atlas Setup (5 Minutes)

Follow these steps to get your database up and running quickly!

## ✅ Step 1: Create MongoDB Atlas Account (2 min)

1. Visit: https://www.mongodb.com/cloud/atlas/register
2. Sign up (Google/GitHub sign-in recommended)
3. Skip the survey if you want

## ✅ Step 2: Create Free Database (1 min)

1. Click **"+ Create"** or **"Build a Database"**
2. Choose **"M0 FREE"** tier (512MB, Perfect for starting!)
3. Choose **AWS** and select region closest to you
4. Cluster Name: `PetaMini` (or keep default)
5. Click **"Create Cluster"** ⏱️ (Wait 1-3 minutes)

## ✅ Step 3: Create Database User (1 min)

1. Click **"Database Access"** in left sidebar
2. Click **"+ ADD NEW DATABASE USER"**
3. Select **"Password"** authentication method
4. Set credentials:
   - Username: `petamini_admin`
   - Password: Click **"Autogenerate Secure Password"** and **SAVE IT!**
5. Database User Privileges: **"Atlas admin"**
6. Click **"Add User"**

## ✅ Step 4: Allow Network Access (30 sec)

1. Click **"Network Access"** in left sidebar
2. Click **"+ ADD IP ADDRESS"**
3. Click **"ALLOW ACCESS FROM ANYWHERE"**
   - This adds `0.0.0.0/0` (good for development)
   - For production: use your server's specific IP
4. Click **"Confirm"**

## ✅ Step 5: Get Connection String (30 sec)

1. Click **"Database"** in left sidebar
2. Click **"Connect"** button on your cluster
3. Choose **"Connect your application"**
4. Driver: **Go** / Version: **1.13 or later**
5. **COPY** the connection string (looks like this):
   ```
   mongodb+srv://petamini_admin:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
6. **REPLACE** `<password>` with your actual password from Step 3

## ✅ Step 6: Configure Your Backend (30 sec)

1. Navigate to backend folder:

   ```bash
   cd backend
   ```

2. Copy environment template:

   ```bash
   copy .env.example .env
   ```

3. Open `.env` file and update:

   ```env
   # Replace with your connection string from Step 5
   MONGODB_URI=mongodb+srv://petamini_admin:YOUR_PASSWORD_HERE@cluster0.xxxxx.mongodb.net/petamini?retryWrites=true&w=majority
   DATABASE_NAME=petamini

   # Add your Telegram bot token
   TELEGRAM_BOT_TOKEN=your_bot_token_from_botfather
   ```

## ✅ Step 7: Test Connection (30 sec)

```bash
# Test if connection works
go run scripts/test_connection.go
```

You should see:

```
✅ Successfully connected to MongoDB!
```

## ✅ Step 8: Initialize Database (30 sec)

```bash
# Create collections and add sample data
go run scripts/init_db.go
```

You should see:

```
✅ Created collection: pokemons
✅ Created collection: purchases
✅ Created collection: users
✅ Created indexes
✅ Seeded 4 sample Pokemon
✅ Database initialization complete!
```

## ✅ Step 9: Start Backend Server (10 sec)

```bash
go run main.go
```

You should see:

```
✅ Connected to MongoDB successfully
✅ Authorized on account YourBotName
🚀 Server starting on port 8080
```

## ✅ Step 10: Verify It Works (10 sec)

Open browser or use curl:

```bash
curl http://localhost:8080/health
```

Should return:

```json
{ "status": "healthy", "timestamp": 1729436400 }
```

---

## 🎉 Success! Your Backend is Ready!

### What You've Set Up:

- ✅ Free cloud MongoDB database (512MB)
- ✅ Collections: pokemons, purchases, users
- ✅ Indexes for fast queries
- ✅ 4 sample Pokemon (Bulbasaur, Charmander, Pikachu, Mewtwo)
- ✅ Backend API running on port 8080

### Next Steps:

1. Start your frontend: `cd .. && npm run dev`
2. Open Telegram and test your mini app
3. Try purchasing a Pokemon card!

### View Your Data:

1. Go to MongoDB Atlas Dashboard
2. Click **"Browse Collections"**
3. See your Pokemon, purchases, and users!

---

## 🔧 Troubleshooting

### Can't connect?

```bash
# Check your connection string format
# Should look like: mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/...
```

### Password special characters?

```bash
# URL encode special characters:
# @ → %40
# : → %3A
# / → %2F
# ? → %3F
# # → %23
```

### IP not whitelisted?

```bash
# Go to Network Access → Add IP Address → Allow from Anywhere
```

### Still stuck?

```bash
# Run connection test with details:
go run scripts/test_connection.go
```

---

## 💰 Cost: $0 / month

Your free tier includes:

- ✅ 512 MB storage
- ✅ Shared RAM
- ✅ Shared CPU
- ✅ Perfect for up to 10,000 users
- ✅ No credit card required!

---

## 📚 Useful Links

- [MongoDB Atlas Dashboard](https://cloud.mongodb.com/)
- [MongoDB Go Driver Docs](https://pkg.go.dev/go.mongodb.org/mongo-driver)
- [Telegram Bot API](https://core.telegram.org/bots/api)

**Happy Coding! 🚀**
