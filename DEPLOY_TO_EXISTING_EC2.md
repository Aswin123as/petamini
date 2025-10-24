# Deploy to Your Existing EC2 Instance

## 🚀 Quick Deployment (3 Steps)

### Step 1: Get Your EC2 Instance Details

From AWS Console (https://console.aws.amazon.com/ec2):
1. Go to **EC2** → **Instances**
2. Find your instance and note:
   - **Public IP Address**: (e.g., `3.123.45.67`)
   - **Key Pair Name**: (e.g., `my-key.pem`)

### Step 2: Ensure Security Group Allows Traffic

Your instance needs these ports open:
- ✅ Port 22 (SSH)
- ✅ Port 80 (HTTP)
- ✅ Port 8080 (Backend API)

**To check/add:**
1. Select your instance
2. Click **Security** tab
3. Click the security group link
4. Click **Edit inbound rules**
5. Ensure these rules exist:
   - SSH (22) - Your IP
   - HTTP (80) - 0.0.0.0/0
   - Custom TCP (8080) - 0.0.0.0/0

### Step 3: Connect and Deploy

#### Option A: Using EC2 Instance Connect (Easiest - No SSH Key Needed)

1. Go to EC2 Console
2. Select your instance
3. Click **Connect** button
4. Choose **EC2 Instance Connect**
5. Click **Connect**

Once connected, run:
```bash
curl -o deploy.sh https://raw.githubusercontent.com/Aswin123as/petamini/main/deploy-to-existing-ec2.sh
chmod +x deploy.sh
./deploy.sh
```

#### Option B: Using SSH from Your Computer

**On Windows (PowerShell):**

```powershell
# Navigate to where your key file is
cd "path\to\your\key"

# Set key permissions (if needed)
icacls your-key.pem /inheritance:r
icacls your-key.pem /grant:r "$env:USERNAME:(R)"

# Connect (replace with your IP and key name)
ssh -i your-key.pem ec2-user@YOUR_INSTANCE_IP

# Or for Ubuntu instances:
ssh -i your-key.pem ubuntu@YOUR_INSTANCE_IP
```

**Once connected via SSH:**

```bash
# Copy the deployment script to EC2
# (From your local computer, open another PowerShell window)
scp -i your-key.pem deploy-to-existing-ec2.sh ec2-user@YOUR_INSTANCE_IP:~/

# Back in the SSH session, run:
chmod +x deploy-to-existing-ec2.sh
./deploy-to-existing-ec2.sh
```

**OR copy/paste the script content:**

```bash
# In SSH session, create the script
nano deploy.sh

# Paste the content from deploy-to-existing-ec2.sh
# Press Ctrl+X, then Y, then Enter to save

# Run it
chmod +x deploy.sh
./deploy.sh
```

---

## ✅ What the Script Does

1. ✅ Updates system packages
2. ✅ Installs Go 1.23, Node.js, Nginx
3. ✅ Clones your GitHub repository
4. ✅ Builds backend (Go)
5. ✅ Creates systemd service for backend
6. ✅ Builds frontend (React)
7. ✅ Configures Nginx as reverse proxy
8. ✅ Starts all services

---

## 🎉 After Deployment

Your app will be live at:
- **Frontend**: `http://YOUR_INSTANCE_IP`
- **Backend**: `http://YOUR_INSTANCE_IP:8080/api`
- **Health**: `http://YOUR_INSTANCE_IP:8080/health`

---

## 📊 Useful Commands

```bash
# Check backend status
sudo systemctl status petamini-backend

# View backend logs (live)
sudo journalctl -u petamini-backend -f

# View backend logs (last 50 lines)
sudo journalctl -u petamini-backend -n 50

# Restart backend
sudo systemctl restart petamini-backend

# Check Nginx status
sudo systemctl status nginx

# Restart Nginx
sudo systemctl restart nginx

# View Nginx access logs
sudo tail -f /var/log/nginx/access.log

# View Nginx error logs
sudo tail -f /var/log/nginx/error.log
```

---

## 🔄 Update Your App Later

To update your deployed app after making changes:

```bash
# SSH into EC2
ssh -i your-key.pem ec2-user@YOUR_INSTANCE_IP

# Update code
cd petamini
git pull

# Rebuild backend
cd backend
go build -o petamini-server main.go
sudo systemctl restart petamini-backend

# Rebuild frontend
cd ..
npm run build
sudo cp -r dist/* /usr/share/nginx/html/

echo "✅ App updated!"
```

---

## 🆘 Troubleshooting

### Backend not starting?
```bash
# Check logs
sudo journalctl -u petamini-backend -n 100

# Check if port 8080 is already in use
sudo netstat -tlnp | grep 8080

# Test manually
cd ~/petamini/backend
./petamini-server
```

### Can't connect to MongoDB?
- Add EC2 instance public IP to MongoDB Atlas IP whitelist
- Or use `0.0.0.0/0` to allow all IPs

### Frontend shows 404?
```bash
# Check Nginx config
sudo nginx -t

# Check files are deployed
ls -la /usr/share/nginx/html/

# Restart Nginx
sudo systemctl restart nginx
```

---

## 🔐 Make Repository Public (if it's private)

If the git clone fails because repository is private:

1. Go to: https://github.com/Aswin123as/petamini
2. Click **Settings**
3. Scroll to **Danger Zone**
4. Click **Change visibility** → **Make public**

OR use SSH deploy keys, but that's more complex.

---

**Ready to deploy?** Choose one of the connection methods above and run the script! 🚀
