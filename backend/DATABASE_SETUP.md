# Database Setup Guide

## Recommended: MongoDB Atlas (Cloud Database)

MongoDB Atlas is the best choice for this project because:

- ✅ **Free Forever Tier** (512MB storage, shared cluster)
- ✅ **No Credit Card Required**
- ✅ **Global Deployment**
- ✅ **Automatic Backups**
- ✅ **Easy Scaling**

## Step 1: Create MongoDB Atlas Account

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
2. Sign up for a free account
3. Create a new project (e.g., "PetaMini")

## Step 2: Create a Free Cluster

1. Click **"Build a Database"**
2. Choose **"M0 FREE"** tier
3. Select a cloud provider (AWS/Google/Azure) and region closest to you
4. Click **"Create Cluster"** (takes 1-3 minutes)

## Step 3: Configure Database Access

### Create Database User:

1. Go to **"Database Access"** in the left sidebar
2. Click **"Add New Database User"**
3. Choose **"Password"** authentication
4. Username: `petamini_admin`
5. Password: Generate a secure password (save it!)
6. Database User Privileges: **"Read and write to any database"**
7. Click **"Add User"**

### Configure Network Access:

1. Go to **"Network Access"** in the left sidebar
2. Click **"Add IP Address"**
3. For development: Click **"Allow Access from Anywhere"** (0.0.0.0/0)
4. For production: Add your server's IP address
5. Click **"Confirm"**

## Step 4: Get Connection String

1. Go to **"Database"** in the left sidebar
2. Click **"Connect"** on your cluster
3. Choose **"Connect your application"**
4. Select **Driver: Go**, **Version: 1.13 or later**
5. Copy the connection string:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
6. Replace `<username>` and `<password>` with your credentials

## Step 5: Update Your .env File

Create/update `backend/.env`:

```env
# Telegram Configuration
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_BOT_USERNAME=your_bot_username

# Server Configuration
PORT=8080
ENVIRONMENT=development

# MongoDB Atlas Connection
MONGODB_URI=mongodb+srv://petamini_admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/petamini?retryWrites=true&w=majority
DATABASE_NAME=petamini

# Frontend URL
FRONTEND_URL=http://localhost:5173

# Payment Configuration
PAYMENT_PROVIDER_TOKEN=
WEBHOOK_SECRET=your_webhook_secret
```

## Step 6: Initialize Database Collections

Run the initialization script:

```bash
cd backend
go run scripts/init_db.go
```

This will:

- Create collections (pokemons, purchases, users)
- Add indexes for better performance
- Seed initial Pokemon data (optional)

## Alternative: Local MongoDB (Development Only)

If you prefer local development:

### Windows:

1. Download [MongoDB Community Server](https://www.mongodb.com/try/download/community)
2. Install with default settings
3. MongoDB will run on `mongodb://localhost:27017`

### macOS (Homebrew):

```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

### Linux (Ubuntu):

```bash
sudo apt-get install mongodb
sudo systemctl start mongodb
```

Then update `.env`:

```env
MONGODB_URI=mongodb://localhost:27017
DATABASE_NAME=petamini
```

## Verify Connection

Test your database connection:

```bash
cd backend
go run main.go
```

You should see:

```
✅ Connected to MongoDB successfully
```

## Database Collections Structure

### 1. pokemons

- Stores Pokemon card information
- Fields: name, image, types, rarity, price, available units

### 2. purchases

- Records all purchase transactions
- Fields: user_id, pokemon_id, units, stars, status

### 3. users

- User profiles and purchase history
- Fields: telegram_id, username, purchased_cards, total_stars_spent

## Monitoring & Management

### MongoDB Atlas Dashboard:

- **Metrics**: View database performance
- **Collections**: Browse data directly
- **Logs**: Debug connection issues
- **Alerts**: Set up notifications

### Using MongoDB Compass (GUI):

1. Download [MongoDB Compass](https://www.mongodb.com/try/download/compass)
2. Connect using your connection string
3. Browse collections visually

## Troubleshooting

### Connection Failed?

- ✅ Check IP whitelist in Network Access
- ✅ Verify username/password
- ✅ Ensure connection string has correct password
- ✅ Check firewall settings

### Can't Create User?

- ✅ Wait for cluster to finish deploying
- ✅ Refresh the page and try again

### Performance Issues?

- ✅ Add indexes on frequently queried fields
- ✅ Consider upgrading from M0 tier if needed

## Security Best Practices

1. ✅ **Never commit** `.env` file to Git
2. ✅ Use **strong passwords** (generated, not dictionary words)
3. ✅ In production, **whitelist specific IPs** only
4. ✅ Rotate credentials periodically
5. ✅ Use **separate databases** for dev/staging/production

## Cost Considerations

- **Free Tier (M0)**:

  - 512 MB storage
  - Shared RAM
  - Perfect for development and small apps
  - No credit card required

- **When to Upgrade**:
  - More than 10,000 active users
  - Need dedicated resources
  - Require advanced features

## Next Steps

1. ✅ Set up MongoDB Atlas account
2. ✅ Configure connection string in `.env`
3. ✅ Run database initialization script
4. ✅ Test backend connection
5. ✅ Start your backend server

---

For detailed documentation, visit:

- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [MongoDB Go Driver](https://pkg.go.dev/go.mongodb.org/mongo-driver)
