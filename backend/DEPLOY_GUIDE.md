# Deploy to Fly.io - Complete Guide

## 🚀 Quick Setup (5 minutes)

### Step 1: Install Fly CLI

**Windows (PowerShell):**

```powershell
powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"
```

**After install, restart your terminal!**

---

### Step 2: Sign Up & Login

```bash
# Sign up (opens browser)
flyctl auth signup

# Or login if you have account
flyctl auth login
```

---

### Step 3: Create Dockerfile

Save this as `Dockerfile` in your `backend/` folder:

```dockerfile
# Build stage
FROM golang:1.21-alpine AS builder

WORKDIR /app

# Copy go mod files
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Build the application
RUN CGO_ENABLED=0 GOOS=linux go build -o petamini-backend .

# Runtime stage
FROM alpine:latest

RUN apk --no-cache add ca-certificates

WORKDIR /root/

# Copy the binary from builder
COPY --from=builder /app/petamini-backend .

# Expose port
EXPOSE 8080

# Run the application
CMD ["./petamini-backend"]
```

---

### Step 4: Launch App

```bash
cd backend
flyctl launch
```

**Answer the prompts:**

- App name: `petamini-backend` (or your choice)
- Region: Choose closest to you
- PostgreSQL: **No** (you're using MongoDB Atlas)
- Redis: **No**
- Deploy now: **No** (we need to set env vars first)

---

### Step 5: Set Environment Variables

```bash
# Set your environment variables
flyctl secrets set TELEGRAM_BOT_TOKEN="7361371574:AAFGyrKZkHVB-GSNgmSHrIOD34fwwczU7oo"
flyctl secrets set MONGODB_URI="mongodb+srv://aswinmail12_db_user:N5ijckeY6tF9PAI9@cluster-petamini.brepo4.mongodb.net/?retryWrites=true&w=majority&appName=Cluster-petamini"
flyctl secrets set DATABASE_NAME="petamini"
flyctl secrets set PORT="8080"
flyctl secrets set ENVIRONMENT="production"
flyctl secrets set FRONTEND_URL="https://yourdomain.com"
flyctl secrets set TELEGRAM_BOT_USERNAME="@Petaminibot"
```

---

### Step 6: Deploy!

```bash
flyctl deploy
```

**That's it!** Your backend is now live! 🎉

---

### Step 7: Get Your URL

```bash
flyctl status
```

Your app will be available at: `https://petamini-backend.fly.dev`

---

## 🔧 Useful Commands

```bash
# View logs
flyctl logs

# Check status
flyctl status

# Scale up/down
flyctl scale count 1

# SSH into container
flyctl ssh console

# Open dashboard
flyctl dashboard
```

---

## 💰 Cost Breakdown

**Free Tier Includes:**

- Up to 3 shared-cpu-1x VMs (256MB RAM)
- 3GB persistent storage
- 160GB outbound data transfer

**Your app usage:**

- 1 VM (256MB) - FREE ✅
- ~500MB storage - FREE ✅
- ~10GB bandwidth - FREE ✅

**Total: $0/month** 🎉

---

## 🌐 Update Frontend

After deployment, update your frontend `.env.local`:

```env
VITE_BACKEND_URL=https://petamini-backend.fly.dev
```

And rebuild:

```bash
npm run build
```

---

## 📊 Monitoring

**Check if backend is running:**

```bash
curl https://petamini-backend.fly.dev/health
```

Should return:

```json
{ "status": "healthy", "timestamp": 1234567890 }
```

---

## 🐛 Troubleshooting

**App won't start:**

```bash
flyctl logs
```

**Need more resources:**

```bash
flyctl scale vm shared-cpu-1x --memory 512
```

**Update secrets:**

```bash
flyctl secrets set KEY="value"
```

---

## 🔄 Auto-Deploy from GitHub

**Option 1: GitHub Actions**

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Fly.io

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: superfly/flyctl-actions/setup-flyctl@master
      - run: flyctl deploy --remote-only
        env:
          FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}
```

Get token:

```bash
flyctl auth token
```

Add to GitHub Secrets as `FLY_API_TOKEN`

---

## ✅ Production Checklist

- [ ] Environment variables set
- [ ] MongoDB Atlas IP whitelist updated (allow 0.0.0.0/0)
- [ ] Telegram bot token working
- [ ] Frontend URL updated
- [ ] Health check endpoint working
- [ ] Bot commands responding

---

## 📈 Next Steps

**Scaling:** If you outgrow free tier:

- Shared CPU (512MB): $1.94/month
- Shared CPU (1GB): $3.88/month
- Dedicated CPU (2GB): $62/month

**Custom Domain:**

```bash
flyctl certs create yourdomain.com
```

---

Need help setting this up? Just ask! 🚀
