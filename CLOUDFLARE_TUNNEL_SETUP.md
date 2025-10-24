# Cloudflare Tunnel Setup Guide

## What You'll Get
- Free HTTPS URL (e.g., `https://random-words.trycloudflare.com`)
- Automatic SSL certificate
- No domain name required
- Works with Telegram Mini Apps

## Quick Setup (5 minutes)

### Step 1: SSH into your EC2 instance
```bash
ssh -i your-key.pem ec2-user@3.26.150.79
```

### Step 2: Download and install cloudflared
```bash
# Download cloudflared
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64

# Make it executable and move to system path
sudo mv cloudflared-linux-amd64 /usr/local/bin/cloudflared
sudo chmod +x /usr/local/bin/cloudflared

# Verify installation
cloudflared --version
```

### Step 3: Start the tunnel
```bash
# Run tunnel pointing to your frontend on port 80
cloudflared tunnel --url http://localhost:80
```

### Step 4: Get your HTTPS URL
The output will show something like:
```
Your quick tunnel has been created! Visit it at:
https://random-words-example.trycloudflare.com
```

**Copy this URL - this is your HTTPS endpoint!**

---

## Making it Permanent (Run in Background)

### Option A: Using nohup (Simple)
```bash
nohup cloudflared tunnel --url http://localhost:80 > /var/log/cloudflared.log 2>&1 &
```

### Option B: Using systemd service (Production)
```bash
# Create service file
sudo tee /etc/systemd/system/cloudflared.service > /dev/null <<EOF
[Unit]
Description=Cloudflare Tunnel
After=network.target

[Service]
Type=simple
User=ec2-user
ExecStart=/usr/local/bin/cloudflared tunnel --url http://localhost:80
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Enable and start service
sudo systemctl daemon-reload
sudo systemctl enable cloudflared
sudo systemctl start cloudflared

# Check status
sudo systemctl status cloudflared

# View logs
sudo journalctl -u cloudflared -f
```

---

## Testing Your HTTPS URL

1. **Browser Test**: Open the HTTPS URL in your browser
2. **Telegram Bot**: Update your bot's Mini App URL to the HTTPS URL
3. **Check Certificate**: Should show valid Cloudflare SSL certificate

---

## Important Notes

### Temporary URL (Quick Tunnel)
- **Free forever**
- **URL changes** each time you restart cloudflared
- **Good for**: Testing, development, demos

### Permanent URL (Named Tunnel)
- Requires Cloudflare account (free)
- **URL stays the same** after restarts
- **Good for**: Production use

---

## Troubleshooting

### If tunnel doesn't start:
```bash
# Check if port 80 is in use
sudo lsof -i :80

# Restart Docker if needed
docker-compose restart frontend
```

### If you get connection errors:
```bash
# Check Docker containers are running
docker-compose ps

# Check nginx logs
docker-compose logs frontend
```

### To stop the tunnel:
```bash
# If running in foreground: Ctrl+C

# If running with nohup:
pkill cloudflared

# If running as systemd service:
sudo systemctl stop cloudflared
```

---

## Next Steps After Setup

1. ✅ Get your HTTPS URL from cloudflared output
2. ✅ Test the URL in your browser
3. ✅ Update your Telegram Bot settings with the new HTTPS URL
4. ✅ Test the Mini App in Telegram

---

## Cost
**$0 - Completely Free!**
