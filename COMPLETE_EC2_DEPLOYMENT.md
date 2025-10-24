# 🚀 Complete EC2 Deployment Guide - PetaMini (Backend + Frontend)

Deploy your entire application (Go backend + React frontend) on a single AWS EC2 instance.

---

## 📋 What We'll Deploy

- ✅ Go Backend (Port 8080)
- ✅ React Frontend (Nginx on Port 80/443)
- ✅ MongoDB Atlas (external)
- ✅ SSL Certificate (Let's Encrypt - optional)
- ✅ Auto-start services on reboot

---

## 💰 Cost Estimate

- **t2.micro**: FREE for 1 year (AWS Free Tier), then ~$8/month
- **t3.micro**: ~$7.5/month (better performance)
- **t3.small**: ~$15/month (recommended for production)

---

## 🎯 Step 1: Launch EC2 Instance

### From AWS Console:

1. **Go to EC2 Dashboard**: https://console.aws.amazon.com/ec2
2. **Click "Launch Instance"**

3. **Name**: `petamini-server`

4. **Choose AMI**:

   - Select **Amazon Linux 2023** or **Ubuntu Server 22.04 LTS**
   - Architecture: 64-bit (x86)

5. **Instance Type**:

   - **t2.micro** (Free tier eligible) or
   - **t3.small** (Recommended for production)

6. **Key Pair**:

   - Click "Create new key pair"
   - Name: `petamini-key`
   - Type: RSA
   - Format: `.pem` (for SSH)
   - Download and save it securely!

7. **Network Settings**:

   - ✅ Allow SSH (Port 22) from **My IP** (your current IP)
   - ✅ Allow HTTP (Port 80) from **Anywhere (0.0.0.0/0)**
   - ✅ Allow HTTPS (Port 443) from **Anywhere (0.0.0.0/0)**
   - ✅ Add Custom TCP Rule: Port **8080** from **Anywhere** (for backend API)

8. **Configure Storage**:

   - 20 GB gp3 (Free tier: 30GB)

9. **Click "Launch Instance"**

10. **Wait 2-3 minutes** for instance to start

11. **Get Public IP**:
    - Select your instance
    - Copy the **Public IPv4 address** (e.g., 3.123.45.67)

---

## 🔐 Step 2: Connect to EC2

### For Windows (PowerShell):

```powershell
# Navigate to where you saved the .pem file
cd C:\Users\YourName\Downloads

# Set correct permissions (Windows)
icacls petamini-key.pem /inheritance:r
icacls petamini-key.pem /grant:r "%username%":"(R)"

# Connect via SSH (replace with your IP)
ssh -i petamini-key.pem ec2-user@YOUR_EC2_PUBLIC_IP

# For Ubuntu:
ssh -i petamini-key.pem ubuntu@YOUR_EC2_PUBLIC_IP
```

---

## 📦 Step 3: Install Dependencies

Once connected to EC2, run these commands:

### For Amazon Linux 2023:

```bash
# Update system
sudo yum update -y

# Install Git
sudo yum install -y git

# Install Node.js (for frontend)
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs

# Install Go
wget https://go.dev/dl/go1.23.0.linux-amd64.tar.gz
sudo tar -C /usr/local -xzf go1.23.0.linux-amd64.tar.gz
echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.bashrc
source ~/.bashrc

# Verify installations
node --version
npm --version
go version

# Install Nginx (for frontend)
sudo yum install -y nginx

# Start Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### For Ubuntu:

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Git
sudo apt install -y git

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install Go
wget https://go.dev/dl/go1.23.0.linux-amd64.tar.gz
sudo tar -C /usr/local -xzf go1.23.0.linux-amd64.tar.gz
echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.bashrc
source ~/.bashrc

# Verify installations
node --version
npm --version
go version

# Install Nginx
sudo apt install -y nginx

# Start Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

---

## 🔧 Step 4: Clone and Setup Backend

```bash
# Create app directory
sudo mkdir -p /var/www/petamini
sudo chown -R $USER:$USER /var/www/petamini
cd /var/www/petamini

# Clone your repository (replace with your repo URL)
git clone https://github.com/Aswin123as/petamini.git .

# Or if private, use SSH or token

# Go to backend
cd backend

# Create .env file
nano .env
```

**Add these environment variables:**

```env
MONGODB_URI=mongodb+srv://aswinmail12_db_user:N5ijckeY6tF9PAI9@cluster-petamini.brepo4.mongodb.net/?retryWrites=true&w=majority&appName=Cluster-petamini&tlsInsecure=true
TELEGRAM_BOT_TOKEN=7361371574:AAFGyrKZkHVB-GSNgmSHrIOD34fwwczU7oo
PORT=8080
ENVIRONMENT=production
```

Save: `Ctrl+X`, then `Y`, then `Enter`

```bash
# Build backend
go build -o petamini-backend main.go

# Test backend
./petamini-backend
# Should see: "Server running on port 8080"
# Press Ctrl+C to stop
```

---

## 🎨 Step 5: Build and Setup Frontend

```bash
# Go to frontend directory
cd /var/www/petamini

# Create .env file for frontend
nano .env
```

**Add:**

```env
VITE_API_URL=http://YOUR_EC2_PUBLIC_IP:8080/api
```

Save and exit.

```bash
# Install dependencies
npm install

# Build for production
npm run build

# Copy build to Nginx directory
sudo cp -r dist/* /usr/share/nginx/html/
```

---

## ⚙️ Step 6: Configure Nginx

```bash
# Edit Nginx configuration
sudo nano /etc/nginx/nginx.conf
```

**Replace the `server` block with:**

```nginx
http {
    # ... existing config ...

    server {
        listen 80;
        server_name YOUR_EC2_PUBLIC_IP;

        # Frontend
        location / {
            root /usr/share/nginx/html;
            try_files $uri $uri/ /index.html;
        }

        # Backend API proxy
        location /api/ {
            proxy_pass http://localhost:8080/api/;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        }

        # Backend health check
        location /health {
            proxy_pass http://localhost:8080/health;
        }
    }
}
```

Save and exit.

**Test Nginx configuration:**

```bash
sudo nginx -t
```

**Reload Nginx:**

```bash
sudo systemctl reload nginx
```

---

## 🔄 Step 7: Create Systemd Service for Backend

```bash
# Create service file
sudo nano /etc/systemd/system/petamini-backend.service
```

**Add this content:**

```ini
[Unit]
Description=PetaMini Go Backend
After=network.target

[Service]
Type=simple
User=ec2-user
WorkingDirectory=/var/www/petamini/backend
EnvironmentFile=/var/www/petamini/backend/.env
ExecStart=/var/www/petamini/backend/petamini-backend
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

**For Ubuntu, change `User=ec2-user` to `User=ubuntu`**

Save and exit.

**Start and enable service:**

```bash
# Reload systemd
sudo systemctl daemon-reload

# Start backend service
sudo systemctl start petamini-backend

# Enable on boot
sudo systemctl enable petamini-backend

# Check status
sudo systemctl status petamini-backend
```

---

## ✅ Step 8: Test Your Deployment

### Test Backend API:

```bash
# Health check
curl http://localhost:8080/health

# From outside EC2
curl http://YOUR_EC2_PUBLIC_IP:8080/health

# Test API
curl http://YOUR_EC2_PUBLIC_IP:8080/api/linkers
```

### Test Frontend:

Open browser and go to:

```
http://YOUR_EC2_PUBLIC_IP
```

You should see your frontend, and it should connect to the backend!

---

## 🔒 Step 9: Setup SSL (HTTPS) - Optional but Recommended

### Using Let's Encrypt (Free SSL):

```bash
# Install Certbot
# For Amazon Linux:
sudo yum install -y certbot python3-certbot-nginx

# For Ubuntu:
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate (replace with your domain)
sudo certbot --nginx -d yourdomain.com

# Follow the prompts
# Certbot will automatically configure Nginx for HTTPS
```

**If you don't have a domain:**

- Use the EC2 IP for now
- Later, get a domain from Namecheap, GoDaddy, etc.
- Point domain A record to your EC2 IP
- Then run certbot

---

## 📊 Step 10: Monitoring and Logs

### View Backend Logs:

```bash
# Real-time logs
sudo journalctl -u petamini-backend -f

# Last 100 lines
sudo journalctl -u petamini-backend -n 100

# Logs from today
sudo journalctl -u petamini-backend --since today
```

### View Nginx Logs:

```bash
# Access logs
sudo tail -f /var/log/nginx/access.log

# Error logs
sudo tail -f /var/log/nginx/error.log
```

### Check Service Status:

```bash
# Backend status
sudo systemctl status petamini-backend

# Nginx status
sudo systemctl status nginx

# Restart if needed
sudo systemctl restart petamini-backend
sudo systemctl restart nginx
```

---

## 🔄 Step 11: Update/Redeploy

When you make changes to your code:

```bash
# SSH into EC2
ssh -i petamini-key.pem ec2-user@YOUR_EC2_PUBLIC_IP

# Pull latest code
cd /var/www/petamini
git pull origin main

# Update Backend
cd backend
go build -o petamini-backend main.go
sudo systemctl restart petamini-backend

# Update Frontend
cd /var/www/petamini
npm run build
sudo cp -r dist/* /usr/share/nginx/html/
```

---

## 🛡️ Security Best Practices

### 1. Update Security Group:

- Remove port 8080 from public access (only Nginx needs it internally)
- Keep only ports 22, 80, 443 open

### 2. Setup Firewall:

```bash
# For Amazon Linux (firewalld)
sudo systemctl start firewalld
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --permanent --add-service=ssh
sudo firewall-cmd --reload

# For Ubuntu (ufw)
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### 3. Keep System Updated:

```bash
# Amazon Linux
sudo yum update -y

# Ubuntu
sudo apt update && sudo apt upgrade -y
```

### 4. Hide .env file:

```bash
chmod 600 /var/www/petamini/backend/.env
```

---

## 🆘 Troubleshooting

### Backend Won't Start:

```bash
# Check logs
sudo journalctl -u petamini-backend -n 50

# Test manually
cd /var/www/petamini/backend
./petamini-backend

# Check if port is in use
sudo netstat -tlnp | grep 8080
```

### MongoDB Connection Error:

```bash
# Test from EC2
curl -I mongodb+srv://cluster-petamini.brepo4.mongodb.net

# Check if MongoDB Atlas allows EC2 IP
# Go to MongoDB Atlas → Network Access → Add IP Address
# Add your EC2 public IP or 0.0.0.0/0
```

### Nginx 502 Bad Gateway:

```bash
# Check if backend is running
sudo systemctl status petamini-backend

# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Test backend directly
curl http://localhost:8080/health
```

### Can't Access from Browser:

- Check EC2 Security Group allows ports 80, 443
- Verify Nginx is running: `sudo systemctl status nginx`
- Check if frontend files exist: `ls /usr/share/nginx/html/`

---

## 📈 Monitoring Setup (Optional)

### Install PM2 for Better Process Management:

```bash
sudo npm install -g pm2

# Start backend with PM2 (alternative to systemd)
cd /var/www/petamini/backend
pm2 start ./petamini-backend --name petamini-backend
pm2 save
pm2 startup
```

---

## 💾 Backup Strategy

```bash
# Create backup script
nano ~/backup.sh
```

**Add:**

```bash
#!/bin/bash
BACKUP_DIR="/home/ec2-user/backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup application
tar -czf $BACKUP_DIR/petamini_$DATE.tar.gz /var/www/petamini

# Keep only last 7 backups
ls -t $BACKUP_DIR/petamini_*.tar.gz | tail -n +8 | xargs rm -f

echo "Backup completed: petamini_$DATE.tar.gz"
```

```bash
chmod +x ~/backup.sh

# Run backup
~/backup.sh

# Schedule daily backup (optional)
crontab -e
# Add: 0 2 * * * /home/ec2-user/backup.sh
```

---

## ✅ Deployment Checklist

- [ ] EC2 instance launched
- [ ] Security groups configured (ports 22, 80, 443)
- [ ] Connected via SSH
- [ ] Git, Node.js, Go, Nginx installed
- [ ] Repository cloned
- [ ] Backend .env configured
- [ ] Backend built and tested
- [ ] Frontend .env configured
- [ ] Frontend built and deployed
- [ ] Nginx configured
- [ ] Systemd service created
- [ ] Services started and enabled
- [ ] Health check passing
- [ ] Frontend accessible
- [ ] API endpoints working
- [ ] SSL configured (optional)
- [ ] MongoDB connection verified

---

## 🎉 Success!

Your application is now running on EC2:

- **Frontend**: `http://YOUR_EC2_PUBLIC_IP`
- **Backend API**: `http://YOUR_EC2_PUBLIC_IP/api`
- **Health Check**: `http://YOUR_EC2_PUBLIC_IP/health`

With SSL (if configured):

- **Frontend**: `https://yourdomain.com`
- **Backend API**: `https://yourdomain.com/api`

---

## 📞 Support

- AWS EC2 Docs: https://docs.aws.amazon.com/ec2/
- Nginx Docs: https://nginx.org/en/docs/
- Let's Encrypt: https://letsencrypt.org/

---

**Total Time**: 30-45 minutes
**Monthly Cost**: $0-15 (depending on instance type)
**Uptime**: 99.9% (always on, no cold starts!)
