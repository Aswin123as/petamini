# ✅ Go Installation Complete!

Go has been successfully installed on your system.

## 🎯 Next Steps

### Option 1: Restart Your Terminal (Recommended)

1. **Close ALL PowerShell/CMD windows**
2. **Open a NEW PowerShell window**
3. **Verify Go is installed:**

   ```powershell
   go version
   ```

   You should see: `go version go1.25.3 windows/amd64`

4. **Navigate to backend and start:**
   ```powershell
   cd "d:\telegram-mini-app\New folder\TMA\petamini\backend"
   go run main.go
   ```

### Option 2: Use the Startup Script

Double-click `start-backend.bat` in the `backend` folder.

This script will:

- ✅ Check if Go is installed
- ✅ Download dependencies
- ✅ Create .env if missing
- ✅ Start the backend server

### Option 3: Restart Your Computer

If the terminal doesn't recognize `go` after restarting:

1. Restart your computer
2. Open a NEW terminal
3. Try `go version` again

## 📋 What Was Installed

- **Go Version:** 1.25.3
- **Installation Path:** `C:\Program Files\Go`
- **Go Binaries:** `C:\Program Files\Go\bin`
- **Go Workspace:** `%USERPROFILE%\go`

## 🧪 Verify Installation

After restarting your terminal, run:

```powershell
# Check Go version
go version

# Check Go environment
go env GOPATH
go env GOROOT
```

Expected output:

```
go version go1.25.3 windows/amd64
C:\Users\YourName\go
C:\Program Files\Go
```

## 🚀 Start Backend Server

### Method 1: Command Line

```powershell
# Navigate to backend
cd "d:\telegram-mini-app\New folder\TMA\petamini\backend"

# Download dependencies
go mod download

# Start server
go run main.go
```

### Method 2: Batch Script

```powershell
# Just double-click this file:
backend\start-backend.bat
```

### Method 3: Using Makefile (if you have make)

```powershell
cd backend
make dev
```

## ⚙️ Configure Backend

Before starting, create `.env` file:

```powershell
cd backend
copy .env.example .env
```

Edit `.env` with your configuration:

```env
TELEGRAM_BOT_TOKEN=your_bot_token_here
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/petamini
PORT=8080
```

## 📊 Expected Output

When you run `go run main.go`, you should see:

```
✅ Connected to MongoDB successfully
✅ Authorized on account YourBotName
🚀 Server starting on port 8080
```

Or if MongoDB is not configured:

```
No .env file found, using environment variables
❌ MONGODB_URI not set in environment
```

## 🔧 Troubleshooting

### "go is not recognized" (After Restart)

**Solution 1:** Check PATH

```powershell
$env:Path -split ';' | Select-String 'Go'
```

Should show: `C:\Program Files\Go\bin`

**Solution 2:** Add to PATH manually

1. Open System Properties (Win + Break)
2. Click "Environment Variables"
3. Under "System variables", find "Path"
4. Add: `C:\Program Files\Go\bin`
5. Click OK
6. Restart terminal

**Solution 3:** Reinstall Go

```powershell
winget uninstall GoLang.Go
winget install GoLang.Go
```

### MongoDB Connection Error

If you see:

```
❌ Failed to connect to MongoDB
```

**Solution:**

1. Follow `QUICKSTART.md` to set up MongoDB Atlas
2. Update `.env` with your connection string
3. Restart the server

### Port Already in Use

If you see:

```
Error: listen tcp :8080: bind: Only one usage of each socket address
```

**Solution:**

```powershell
# Find what's using port 8080
netstat -ano | findstr :8080

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F

# Or change port in .env
PORT=8081
```

## 🎓 Learning Go

New to Go? Check out:

- [Go Tour](https://go.dev/tour/) - Interactive tutorial
- [Go by Example](https://gobyexample.com/) - Hands-on examples
- [Go Documentation](https://go.dev/doc/) - Official docs

## ✅ Checklist

- [x] Go installed via Winget
- [ ] Terminal restarted
- [ ] `go version` works
- [ ] Dependencies downloaded (`go mod download`)
- [ ] `.env` file configured
- [ ] MongoDB Atlas set up
- [ ] Backend server running
- [ ] Frontend connecting to backend

## 📞 Need Help?

1. Read `GO_INSTALLATION.md` for detailed installation steps
2. Read `QUICKSTART.md` for database setup
3. Read `README.md` for API documentation

---

**Your Go installation is complete! 🎉**

**Next:** Close this terminal, open a NEW one, and run `go version` to verify.
