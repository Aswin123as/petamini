# MongoDB Atlas TLS Connection Issue - Diagnosis & Solutions

## 🔴 Problem Summary

Your backend cannot connect to MongoDB Atlas due to a **TLS handshake failure**:

```
remote error: tls: internal error
```

### What We've Confirmed:

- ✅ TCP connection to Atlas hosts works (port 27017 reachable)
- ✅ DNS resolution works correctly
- ✅ MongoDB driver is up to date (v1.17.4)
- ✅ IP address is likely whitelisted (TCP connects)
- ❌ TLS handshake fails on all three Atlas replica set members
- ❌ Even `InsecureSkipVerify=true` fails (server-side rejection)

### Root Cause:

This is a **known incompatibility** between:

- Go's crypto/tls implementation on Windows
- MongoDB Atlas TLS requirements
- Potentially Windows TLS/SSL stack issues

---

## 🚀 IMMEDIATE SOLUTIONS (Choose One)

### Option 1: Use MongoDB Atlas with Connection Workaround (RECOMMENDED)

Try using the **standard mongodb:// connection** instead of mongodb+srv://:

1. **Update your `.env` file:**

```env
# Replace the mongodb+srv:// line with this:
MONGODB_URI=mongodb://aswinmail12_db_user:N5ijckeY6tF9PAI9@cluster-petamini-shard-00-00.brepo4.mongodb.net:27017,cluster-petamini-shard-00-01.brepo4.mongodb.net:27017,cluster-petamini-shard-00-02.brepo4.mongodb.net:27017/petamini?ssl=true&replicaSet=atlas-ndgydq-shard-0&authSource=admin&retryWrites=true&w=majority
```

2. **Test the connection:**

```powershell
cd backend
go run main.go
```

If this still fails, proceed to Option 2.

---

### Option 2: Install MongoDB Locally (FASTEST FIX)

Install MongoDB Community Edition on Windows:

#### Step 1: Download & Install

1. Download: https://www.mongodb.com/try/download/community
2. Choose: **Windows x64**, **MSI installer**
3. Install with **default settings**
4. Check "Install MongoDB as a Service" ✅
5. Leave "Install MongoDB Compass" unchecked (optional GUI)

#### Step 2: Start MongoDB

MongoDB should start automatically as a Windows service. If not:

```powershell
# Start MongoDB service
net start MongoDB
```

#### Step 3: Update `.env`

```env
# Use local MongoDB
MONGODB_URI=mongodb://localhost:27017
DATABASE_NAME=petamini
```

#### Step 4: Initialize Database

```powershell
cd backend
go run scripts/init_db.go
```

#### Step 5: Start Backend

```powershell
go run main.go
```

You should see:

```
✅ Connected to MongoDB successfully
```

---

### Option 3: Use MongoDB in Docker

If you have Docker Desktop:

#### Step 1: Start MongoDB Container

```powershell
docker run -d --name petamini-mongo -p 27017:27017 -e MONGO_INITDB_ROOT_USERNAME=admin -e MONGO_INITDB_ROOT_PASSWORD=password123 mongo:7
```

#### Step 2: Update `.env`

```env
MONGODB_URI=mongodb://admin:password123@localhost:27017
DATABASE_NAME=petamini
```

#### Step 3: Test Connection

```powershell
cd backend
go run main.go
```

---

### Option 4: Try Alternative Free Cloud Database

If Atlas continues to fail, use **MongoDB Cloud alternatives**:

#### A. Railway.app (Free $5/month credit)

1. Go to https://railway.app/
2. Sign up with GitHub
3. Create new project → Add MongoDB
4. Copy connection string to `.env`

#### B. Render.com (Free tier available)

1. Go to https://render.com/
2. Sign up
3. Create PostgreSQL database (switch from MongoDB)
4. Update backend to use PostgreSQL instead

---

## 🔧 ADVANCED TROUBLESHOOTING

### Try 1: Update Windows Root Certificates

```powershell
# Run as Administrator
certutil -generateSSTFromWU roots.sst
```

Then restart your computer and try again.

### Try 2: Check Antivirus/Firewall

Temporarily disable Windows Defender Firewall or antivirus:

```powershell
# Disable Windows Firewall (temporarily)
netsh advfirewall set allprofiles state off

# Test connection
cd backend
go run main.go

# Re-enable firewall
netsh advfirewall set allprofiles state on
```

### Try 3: Use Older Go Version

The issue might be with Go 1.25.3. Try Go 1.21:

```powershell
# Download Go 1.21 from https://go.dev/dl/
# Install it and test
```

### Try 4: Check MongoDB Atlas Settings

1. Go to https://cloud.mongodb.com/
2. Click your cluster → **Network Access**
3. Verify **0.0.0.0/0** is allowed (or add your IP: 192.168.18.124)
4. Click **Database Access**
5. Verify user `aswinmail12_db_user` exists with correct password

---

## 📊 Comparison of Options

| Option           | Setup Time | Best For           | Cost      |
| ---------------- | ---------- | ------------------ | --------- |
| Local MongoDB    | 5 mins     | Development        | Free      |
| Docker MongoDB   | 2 mins     | If you have Docker | Free      |
| Atlas Workaround | 1 min      | If fix works       | Free      |
| Railway/Render   | 10 mins    | Production-ready   | Free tier |

---

## 🎯 RECOMMENDED ACTION

**For immediate development:**

1. Install local MongoDB (Option 2) - takes 5 minutes
2. Continue building your app
3. Investigate Atlas issue later or before deployment

**For production:**

- Keep trying Atlas with the workaround
- Or use Railway/Render for reliable cloud hosting

---

## 📝 What to Do Next

Copy and run this command to install local MongoDB or try the connection workaround first:

```powershell
# Test if standard mongodb:// URI works (Option 1)
# Manually update .env with the standard URI above, then:
cd backend
go run main.go
```

If that fails:

```powershell
# Download MongoDB Community
start https://www.mongodb.com/try/download/community
```

Let me know which option you'd like to pursue and I'll guide you through it!
