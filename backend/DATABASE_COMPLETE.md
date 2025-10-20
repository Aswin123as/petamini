# Database Setup Complete! 🎉

## What We've Created:

### 1. **Database Setup Guide** (`DATABASE_SETUP.md`)

- Comprehensive guide for MongoDB Atlas setup
- Alternative local MongoDB setup
- Security best practices
- Troubleshooting tips

### 2. **Quick Start Guide** (`QUICKSTART.md`)

- 5-minute setup walkthrough
- Step-by-step with time estimates
- Visual indicators for each step
- Troubleshooting section

### 3. **Database Scripts**

- `scripts/init_db.go` - Initialize collections, indexes, and seed data
- `scripts/test_connection.go` - Test database connection and show stats
- `setup-db.bat` - Windows setup automation script

### 4. **Updated Makefile**

- `make db-test` - Test database connection
- `make db-init` - Initialize database
- `make db-seed` - Seed sample data

---

## 🚀 Recommended: MongoDB Atlas (Free Cloud Database)

**Why MongoDB Atlas?**

- ✅ **$0/month** - Forever free tier (512MB)
- ✅ **No credit card** required
- ✅ **5-minute setup** - Fastest way to get started
- ✅ **Auto backups** - Your data is safe
- ✅ **Global** - Deploy anywhere
- ✅ **Scalable** - Upgrade when you grow

**Perfect for:**

- Development and testing
- Small to medium apps
- Up to 10,000 active users
- Learning and prototyping

---

## 📋 Setup Steps (Choose One)

### Option A: MongoDB Atlas (Recommended) ⭐

1. **Read the Quick Start**:

   ```bash
   cat QUICKSTART.md
   ```

   Or open: `backend/QUICKSTART.md`

2. **Follow 10 simple steps** (5 minutes total)

   - Create account
   - Create free cluster
   - Get connection string
   - Configure `.env`
   - Run initialization

3. **Done!** Your cloud database is ready

### Option B: Local MongoDB (Development Only)

1. **Install MongoDB Community**:

   - Windows: Download from mongodb.com
   - Mac: `brew install mongodb-community`
   - Linux: `sudo apt-get install mongodb`

2. **Update `.env`**:

   ```env
   MONGODB_URI=mongodb://localhost:27017
   DATABASE_NAME=petamini
   ```

3. **Initialize**:
   ```bash
   go run scripts/init_db.go
   ```

---

## 🧪 Test Your Setup

### 1. Test Connection

```bash
cd backend
go run scripts/test_connection.go
```

Expected output:

```
✅ Successfully connected to MongoDB!
📋 Existing collections:
   - pokemons (4 documents)
   - purchases (0 documents)
   - users (0 documents)
```

### 2. Initialize Database

```bash
go run scripts/init_db.go
```

Expected output:

```
✅ Created collection: pokemons
✅ Created collection: purchases
✅ Created collection: users
✅ Created indexes
✅ Seeded 4 sample Pokemon
```

### 3. Start Backend

```bash
go run main.go
```

Expected output:

```
✅ Connected to MongoDB successfully
✅ Authorized on account YourBot
🚀 Server starting on port 8080
```

---

## 📊 Your Database Structure

### Collections Created:

1. **pokemons** (Pokemon Cards)

   ```javascript
   {
     _id: ObjectId,
     pokemon_id: 1,
     name: "Bulbasaur",
     image: "https://...",
     types: ["grass", "poison"],
     rarity: "common",
     total_units: 100,
     available_units: 75,
     price_per_unit: 5  // Telegram Stars
   }
   ```

2. **purchases** (Transaction History)

   ```javascript
   {
     _id: ObjectId,
     user_id: 123456789,  // Telegram User ID
     pokemon_id: "...",
     units: 2,
     total_stars: 10,
     status: "completed",
     invoice_payload: "...",
     created_at: ISODate()
   }
   ```

3. **users** (User Profiles)
   ```javascript
   {
     _id: ObjectId,
     telegram_id: 123456789,
     username: "johndoe",
     purchased_cards: [...],
     total_stars_spent: 150,
     created_at: ISODate()
   }
   ```

### Indexes Created:

- ✅ Unique index on `telegram_id` (users)
- ✅ Unique index on `invoice_payload` (purchases)
- ✅ Index on `rarity` (pokemons)
- ✅ Index on `available_units` (pokemons)
- ✅ Index on `status` (purchases)

---

## 🎮 Sample Data Included

After running `init_db.go`, you'll have:

1. **Bulbasaur** (Common) - 5 ⭐ per unit
2. **Charmander** (Common) - 5 ⭐ per unit
3. **Pikachu** (Rare) - 15 ⭐ per unit
4. **Mewtwo** (Legendary) - 50 ⭐ per unit

---

## 🔐 Security Checklist

- ✅ `.env` file is in `.gitignore` (never commit secrets!)
- ✅ Strong password for database user
- ✅ IP whitelist configured (0.0.0.0/0 for dev only)
- ✅ Use separate databases for dev/prod
- ✅ Rotate credentials periodically

---

## 📱 Next Steps

1. ✅ **Database is ready!**
2. ⏭️ **Get Telegram Bot Token**:
   - Message @BotFather on Telegram
   - Create new bot: `/newbot`
   - Save the token
3. ⏭️ **Update `.env`** with bot token
4. ⏭️ **Start backend**: `go run main.go`
5. ⏭️ **Test frontend**: `cd .. && npm run dev`
6. ⏭️ **Open in Telegram** and buy Pokemon! 🎉

---

## 💡 Pro Tips

### View Your Data:

- **MongoDB Atlas**: Database → Browse Collections
- **MongoDB Compass**: Download and connect with your URI
- **Command Line**: `mongo "your-connection-string"`

### Monitor Usage:

- MongoDB Atlas Dashboard shows:
  - Storage used
  - Network traffic
  - Query performance
  - Active connections

### Backup Data:

- Atlas Free tier: Automatic backups (1-day retention)
- Manual: Database → Backup → Create

### Scale Up When Needed:

- 10K+ users → Upgrade to M10 ($0.08/hour)
- Need more storage → Upgrade tier
- Better performance → Dedicated cluster

---

## 🆘 Need Help?

### Common Issues:

**"Failed to connect"**

- Check internet connection
- Verify connection string format
- Check IP whitelist in Atlas

**"Authentication failed"**

- Verify username/password
- Check for special characters (URL encode them)
- Wait 1-2 minutes after creating user

**"Collection not found"**

- Run: `go run scripts/init_db.go`
- Check database name in connection string

### Get Support:

- MongoDB Atlas: Built-in chat support
- MongoDB Docs: docs.mongodb.com
- Stack Overflow: [mongodb] tag

---

## 📚 Documentation

- `DATABASE_SETUP.md` - Detailed setup guide
- `QUICKSTART.md` - 5-minute quick start
- `README.md` - Backend API documentation
- MongoDB Docs: https://docs.mongodb.com/

---

**Your database is ready to power your Telegram Mini App! 🚀**

Happy coding! 🎉
