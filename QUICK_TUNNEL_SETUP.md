# 🚀 Quick Setup Guide - Named Cloudflare Tunnel

## Super Fast Setup (5 minutes)

### 1️⃣ SSH to your EC2

```bash
ssh -i your-key.pem ubuntu@3.26.150.79
```

### 2️⃣ Download and run the setup script

```bash
# Download the script
wget https://raw.githubusercontent.com/Aswin123as/petamini/main/setup-named-tunnel.sh

# Make it executable
chmod +x setup-named-tunnel.sh

# Run it
./setup-named-tunnel.sh
```

**The script will:**

- ✅ Install cloudflared (if needed)
- ✅ Guide you through Cloudflare login
- ✅ Create named tunnel
- ✅ Configure DNS
- ✅ Install as system service
- ✅ Update your backend .env
- ✅ Restart Docker containers

### 3️⃣ Update your local .env.local

After the script finishes, it will give you a URL like:
`https://petamini-abc123.trycloudflare.com`

Update your local file `d:\telegram-mini-app\New folder\TMA\petamini\.env.local`:

```properties
VITE_API_BASE_URL=https://petamini-abc123.trycloudflare.com/api
```

### 4️⃣ Done! 🎉

Your app now has a permanent HTTPS URL that won't expire!

---

## Manual Setup (if you prefer)

### Step 1: Login

```bash
cloudflared tunnel login
```

### Step 2: Create tunnel

```bash
cloudflared tunnel create petamini
```

### Step 3: Get tunnel ID

```bash
cloudflared tunnel list
# Copy the tunnel ID (e.g., abc123-def456-ghi789)
```

### Step 4: Create config

```bash
mkdir -p ~/.cloudflared
nano ~/.cloudflared/config.yml
```

Paste this (replace TUNNEL_ID):

```yaml
tunnel: TUNNEL_ID
credentials-file: /home/ubuntu/.cloudflared/TUNNEL_ID.json

ingress:
  - hostname: petamini-TUNNEL_ID.trycloudflare.com
    service: http://localhost:80
  - service: http_status:404
```

### Step 5: Route DNS

```bash
cloudflared tunnel route dns petamini petamini-TUNNEL_ID.trycloudflare.com
```

### Step 6: Install service

```bash
sudo cloudflared service install
sudo systemctl start cloudflared
sudo systemctl enable cloudflared
```

### Step 7: Update backend

```bash
cd ~/petamini
nano backend/.env
```

Add/update:

```properties
FRONTEND_URL=http://localhost:5173,https://petamini-TUNNEL_ID.trycloudflare.com
```

### Step 8: Restart

```bash
docker-compose down
docker-compose up -d --build
```

---

## Useful Commands

```bash
# Check tunnel status
sudo systemctl status cloudflared

# View logs
sudo journalctl -u cloudflared -f

# Restart tunnel
sudo systemctl restart cloudflared

# List all tunnels
cloudflared tunnel list

# Test your URL
curl https://your-tunnel-url.trycloudflare.com/health
```

---

## Troubleshooting

### Tunnel not working?

```bash
# Check logs
sudo journalctl -u cloudflared -f

# Restart service
sudo systemctl restart cloudflared

# Check if port 80 is accessible
curl http://localhost/health
```

### DNS not resolving?

- Wait 1-2 minutes for DNS propagation
- Check tunnel is running: `sudo systemctl status cloudflared`
- Verify route: `cloudflared tunnel route dns list`

### CORS errors?

- Make sure backend/.env has the tunnel URL in FRONTEND_URL
- Restart containers: `docker-compose restart`

---

## Benefits

✅ **Permanent URL** - Never changes, even after restart
✅ **Auto-restart** - Starts on system boot
✅ **Free HTTPS** - Cloudflare SSL included
✅ **No expiration** - Unlike quick tunnels
✅ **Production ready** - Stable and reliable

---

## Next Steps After Setup

1. ✅ Test all features through the new URL
2. ✅ Update Telegram bot webhook (if using)
3. ✅ Save tunnel credentials (backup ~/.cloudflared/)
4. 💡 Consider adding custom domain later

---

Need help? Check the full guide: `SETUP_NAMED_CLOUDFLARE_TUNNEL.md`
