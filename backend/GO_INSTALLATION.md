# Go Installation Guide for Windows

## Quick Install (Recommended)

### Option 1: Using Winget (Windows Package Manager)

Open PowerShell as Administrator and run:

```powershell
winget install GoLang.Go
```

After installation, restart your terminal and verify:

```powershell
go version
```

### Option 2: Using Chocolatey

If you have Chocolatey installed:

```powershell
choco install golang
```

### Option 3: Manual Installation

1. **Download Go:**

   - Visit: https://go.dev/dl/
   - Download the Windows installer (e.g., `go1.21.X.windows-amd64.msi`)

2. **Run the installer:**

   - Double-click the downloaded `.msi` file
   - Follow the installation wizard
   - Default installation path: `C:\Program Files\Go`

3. **Verify installation:**
   - Open a **NEW** PowerShell window
   - Run: `go version`
   - You should see: `go version go1.21.X windows/amd64`

## After Installation

### 1. Verify Go is Installed

Open a **NEW** terminal and run:

```powershell
go version
```

Expected output:

```
go version go1.21.5 windows/amd64
```

### 2. Set Up Go Workspace (Optional)

Go will automatically use these paths:

- Go installation: `C:\Program Files\Go`
- Go modules cache: `%USERPROFILE%\go`
- Go binaries: `%USERPROFILE%\go\bin`

### 3. Verify Environment Variables

Check if Go is in your PATH:

```powershell
$env:Path -split ';' | Select-String -Pattern 'Go'
```

You should see:

```
C:\Program Files\Go\bin
```

### 4. Test Go Installation

Create a test file:

```powershell
# Create test directory
mkdir test-go
cd test-go

# Create hello.go
@"
package main

import "fmt"

func main() {
    fmt.Println("Hello, Go!")
}
"@ | Out-File -FilePath hello.go -Encoding UTF8

# Run it
go run hello.go
```

You should see: `Hello, Go!`

## Install Backend Dependencies

Once Go is installed, navigate to your backend folder and install dependencies:

```powershell
cd "d:\telegram-mini-app\New folder\TMA\petamini\backend"
go mod download
```

## Run Your Backend

```powershell
cd "d:\telegram-mini-app\New folder\TMA\petamini\backend"
go run main.go
```

## Troubleshooting

### "go is not recognized"

**Solution 1: Restart your terminal**

- Close all PowerShell/CMD windows
- Open a NEW terminal
- Try `go version` again

**Solution 2: Check PATH manually**

1. Open System Properties → Environment Variables
2. Check "Path" variable contains: `C:\Program Files\Go\bin`
3. If not, add it manually
4. Restart terminal

**Solution 3: Reinstall Go**

- Uninstall Go from Control Panel
- Download and install again from https://go.dev/dl/

### "Cannot find package"

If you see import errors:

```powershell
cd backend
go mod tidy
go mod download
```

### "Port already in use"

If port 8080 is busy:

1. Find what's using it:

```powershell
netstat -ano | findstr :8080
```

2. Kill the process:

```powershell
taskkill /PID <process_id> /F
```

Or change the port in `backend/.env`:

```env
PORT=8081
```

## Quick Reference

```powershell
# Check Go version
go version

# Download dependencies
go mod download

# Tidy dependencies
go mod tidy

# Run the application
go run main.go

# Build executable
go build -o petamini-backend.exe main.go

# Run executable
.\petamini-backend.exe
```

## IDE Support (Optional)

### VS Code Go Extension

1. Install VS Code extension: "Go" by Go Team at Google
2. Open Command Palette (Ctrl+Shift+P)
3. Run: "Go: Install/Update Tools"
4. Select all tools and install

### GoLand (JetBrains)

Professional Go IDE: https://www.jetbrains.com/go/

## Next Steps

After installing Go:

1. ✅ Close and reopen your terminal
2. ✅ Verify: `go version`
3. ✅ Navigate to backend: `cd backend`
4. ✅ Install dependencies: `go mod download`
5. ✅ Run backend: `go run main.go`

---

**Need Help?**

- Go Documentation: https://go.dev/doc/
- Go Tour (Interactive): https://go.dev/tour/
- Go by Example: https://gobyexample.com/
