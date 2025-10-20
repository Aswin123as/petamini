# 🤖 Telegram Bot Features - Complete Guide

## 📋 Overview

The PetaMini bot now includes comprehensive features for managing Pokemon card collections, viewing statistics, and competing on leaderboards!

---

## 🎯 Bot Commands

### Basic Commands

#### `/start`

**Description:** Welcome message and account creation  
**Usage:** `/start`  
**Features:**

- Creates user account in database
- Shows welcome message
- Lists available commands
- Perfect for new users!

**Example Response:**

```
🎮 Welcome to PetaMini - Pokemon Card Collection!

Hey John! 👋

Collect rare Pokemon cards and build your ultimate collection!

🃏 What you can do:
• Buy Pokemon cards with Telegram Stars ⭐
• Build your collection of rare cards
• Compete on the leaderboard
• Track your stats and achievements
```

---

#### `/help`

**Description:** Show all available commands  
**Usage:** `/help`  
**Features:**

- Complete command list
- How to buy cards
- Rarity information
- Support contact

---

### Collection Commands

#### `/collection`

**Description:** View your owned Pokemon cards  
**Usage:** `/collection`  
**Features:**

- Shows all your Pokemon cards
- Groups cards by Pokemon name
- Displays total cards and stars spent
- Empty state for new users

**Example Response:**

```
🎴 John's Pokemon Collection

📊 Total Cards: 15
💎 Total Spent: 450 ⭐

Your Cards:
• Pikachu × 5
• Charmander × 3
• Bulbasaur × 7
```

---

#### `/profile`

**Description:** View your account profile  
**Usage:** `/profile`  
**Features:**

- Basic account info
- Account creation date
- Total collection summary
- Last activity timestamp

**Example Response:**

```
👤 Profile Information

Basic Info:
• Name: John Doe
• Username: @johndoe
• User ID: 123456789

Account Status:
• Created: Oct 20, 2025 10:30
• Last Active: Oct 20, 2025 13:15
• Status: ✅ Active

Collection:
• Total Cards: 15
• Total Purchases: 5
• Total Spent: 450 ⭐
```

---

### Statistics Commands

#### `/stats`

**Description:** View detailed personal statistics  
**Usage:** `/stats`  
**Features:**

- Total cards and unique Pokemon
- Purchase history
- Average spending per purchase
- Cards per purchase ratio
- Account age
- Most recent purchase

**Example Response:**

```
📊 Your Statistics

👤 Profile:
• Username: @johndoe
• Member Since: Oct 15, 2025
• Account Age: 5 days

🎴 Collection Stats:
• Total Cards: 15
• Unique Pokemon: 3
• Total Purchases: 5
• Total Spent: 450 ⭐

📈 Activity:
• Most Recent: Pikachu
• Last Purchase: Oct 20, 2025

💰 Economics:
• Average per Purchase: 90.0 ⭐
• Cards per Purchase: 3.0
```

---

#### `/leaderboard`

**Description:** View top collectors  
**Usage:** `/leaderboard`  
**Features:**

- Shows top 10 collectors
- Ranked by total stars spent
- Medal emojis for top 3
- Shows cards, purchases, and spending

**Example Response:**

```
🏆 Top Collectors Leaderboard

🥇 johndoe
   💎 1500 ⭐ | 🎴 45 cards | 🛍️ 12 purchases

🥈 alice_wonder
   💎 1200 ⭐ | 🎴 38 cards | 🛍️ 10 purchases

🥉 bob_builder
   💎 950 ⭐ | 🎴 29 cards | 🛍️ 8 purchases

4. charlie_brown
   💎 800 ⭐ | 🎴 25 cards | 🛍️ 7 purchases
```

---

#### `/shop`

**Description:** View shop information  
**Usage:** `/shop`  
**Features:**

- Rarity pricing guide
- How to purchase
- Link to mini app
- Limited units warning

**Example Response:**

```
🏪 Pokemon Card Shop

Open the PetaMini mini app to browse all available Pokemon cards!

Available Rarities:
⚪ Common - 10-50 ⭐
🔵 Rare - 100-200 ⭐
🟣 Epic - 300-500 ⭐
🟠 Legendary - 1000+ ⭐
```

---

## 🌐 API Endpoints

All endpoints are RESTful and return JSON responses.

### User Endpoints

#### Get User Profile

```
GET /api/users/profile/:userId
```

**Parameters:**

- `userId` (path) - Telegram user ID

**Response:**

```json
{
  "id": "670f1234567890abcdef",
  "telegramId": 123456789,
  "username": "johndoe",
  "firstName": "John",
  "lastName": "Doe",
  "purchasedCards": [...],
  "totalPurchases": 5,
  "totalSpent": 450,
  "createdAt": "2025-10-15T10:30:00Z",
  "updatedAt": "2025-10-20T13:15:00Z"
}
```

---

#### Get User Statistics

```
GET /api/users/stats/:userId
```

**Parameters:**

- `userId` (path) - Telegram user ID

**Response:**

```json
{
  "telegramId": 123456789,
  "username": "johndoe",
  "totalCards": 15,
  "uniquePokemon": 3,
  "totalPurchases": 5,
  "totalSpent": 450,
  "memberSince": "2025-10-15T10:30:00Z",
  "lastPurchase": "2025-10-20T13:15:00Z"
}
```

---

#### Get User Collection

```
GET /api/users/collection/:userId
```

**Parameters:**

- `userId` (path) - Telegram user ID

**Response:**

```json
{
  "userId": 123456789,
  "collection": [
    {
      "pokemonId": "670f...",
      "pokemonName": "Pikachu",
      "units": 5,
      "purchasedAt": "2025-10-18T14:20:00Z"
    },
    {
      "pokemonId": "670f...",
      "pokemonName": "Charmander",
      "units": 3,
      "purchasedAt": "2025-10-19T09:15:00Z"
    }
  ],
  "total": 2
}
```

---

#### Get Leaderboard

```
GET /api/users/leaderboard?limit=10
```

**Query Parameters:**

- `limit` (optional) - Number of entries (1-100, default: 10)

**Response:**

```json
{
  "leaderboard": [
    {
      "rank": 1,
      "telegramId": 123456789,
      "username": "johndoe",
      "totalCards": 45,
      "totalPurchases": 12,
      "totalSpent": 1500
    }
  ],
  "total": 10
}
```

---

#### Get Top Collectors

```
GET /api/users/top?limit=10
```

**Query Parameters:**

- `limit` (optional) - Number of users (1-100, default: 10)

**Response:**

```json
{
  "collectors": [
    {
      "id": "670f...",
      "telegramId": 123456789,
      "username": "johndoe",
      "purchasedCards": [...],
      "totalPurchases": 12,
      "totalSpent": 1500
    }
  ],
  "total": 10
}
```

---

## 🎮 User Flow Examples

### New User Journey

1. User opens bot → `/start` command
2. Bot creates user account in database
3. User sees welcome message with commands
4. User runs `/shop` to see available cards
5. User opens mini app to purchase
6. After purchase, user runs `/collection` to see cards
7. User checks `/stats` to view statistics
8. User competes on `/leaderboard`

### Regular User Journey

1. User opens mini app
2. Purchases Pokemon cards
3. Runs `/collection` to check cards
4. Runs `/stats` to track progress
5. Runs `/leaderboard` to see ranking
6. Continues collecting!

---

## 📊 Database Schema Updates

### User Model (Enhanced)

```go
type User struct {
    ID             ObjectID       // MongoDB ID
    TelegramID     int64          // Telegram user ID
    Username       string         // Telegram username
    FirstName      string         // First name
    LastName       string         // Last name
    PurchasedCards []OwnedPokemon // Array of owned cards
    TotalPurchases int            // NEW: Number of purchases
    TotalSpent     int            // NEW: Total stars spent
    CreatedAt      time.Time      // Account creation
    UpdatedAt      time.Time      // Last activity
}
```

### New Models

#### UserStats

```go
type UserStats struct {
    TelegramID     int64
    Username       string
    TotalCards     int
    UniquePokemon  int
    TotalPurchases int
    TotalSpent     int
    MemberSince    time.Time
    LastPurchase   time.Time
}
```

#### LeaderboardEntry

```go
type LeaderboardEntry struct {
    Rank           int
    TelegramID     int64
    Username       string
    TotalCards     int
    TotalPurchases int
    TotalSpent     int
}
```

---

## 🚀 Testing Commands

### Test Bot Locally

1. **Start the backend:**

```powershell
cd backend
go run main.go
```

2. **Open your bot in Telegram:**

   - Search for your bot (@YourBotName)

3. **Test commands:**

```
/start
/help
/collection
/stats
/profile
/leaderboard
/shop
```

### Test API Endpoints

```powershell
# Get user profile
curl http://localhost:8080/api/users/profile/123456789

# Get user stats
curl http://localhost:8080/api/users/stats/123456789

# Get leaderboard
curl http://localhost:8080/api/users/leaderboard?limit=5

# Get user collection
curl http://localhost:8080/api/users/collection/123456789
```

---

## 🎨 Customization Tips

### Modify Welcome Message

Edit `handlers/bot_command_handler.go` → `handleStart()` function

### Add Custom Commands

1. Add case in `HandleCommand()` switch statement
2. Create handler function
3. Bot automatically responds!

### Change Leaderboard Size

Modify limit in `/leaderboard` command or API call

### Add Achievements

Extend `User` model with achievements array
Create achievement checking logic
Display in `/profile` or `/stats`

---

## 🐛 Troubleshooting

**Command not responding:**

- Check bot is running (`go run main.go`)
- Verify bot token in `.env` file
- Check logs for errors

**User data not showing:**

- User must run `/start` first
- Check MongoDB connection
- Verify user made at least one purchase

**Leaderboard empty:**

- Need multiple users with purchases
- Check database has user records

---

## 🎯 Next Steps

**Suggested Enhancements:**

1. **Achievements System** - Badges for milestones
2. **Trading System** - Trade cards between users
3. **Daily Rewards** - Login bonuses
4. **Referral System** - Invite friends rewards
5. **Battle System** - Use cards in battles
6. **Rarity Tracking** - Show rarity distribution
7. **Wishlist** - Mark desired Pokemon
8. **Notifications** - New card alerts

**Want to add any of these? Just ask!** 🚀
