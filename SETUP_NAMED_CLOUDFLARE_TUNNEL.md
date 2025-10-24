# Setup Named Cloudflare Tunnel (Permanent & Free)

This guide will help you set up a permanent Cloudflare tunnel that won't expire or change URLs.

## Prerequisites
- Free Cloudflare account (sign up at https://dash.cloudflare.com/sign-up)
- SSH access to your EC2 instance
- cloudflared already installed on EC2

## Step 1: Create Cloudflare Account & Login

### On Your Local Machine:

1. **Sign up for Cloudflare** (if you don't have an account):
   - Go to https://dash.cloudflare.com/sign-up
   - Create a free account

2. **Login to Cloudflare via CLI** (on your EC2):
   ```bash
   cloudflared tunnel login
   ```
   - This will open a browser or give you a URL
   - Login and authorize cloudflared
   - A certificate will be saved to `~/.cloudflared/cert.pem`

## Step 2: Create a Named Tunnel

### On EC2, run:

```bash
# Create a tunnel named 'petamini'
cloudflared tunnel create petamini
```

This will:
- Create a tunnel with a permanent UUID
- Save credentials to `~/.cloudflared/<tunnel-id>.json`
- Output your tunnel ID (save this!)

**Example output:**
```
Tunnel credentials written to /home/ubuntu/.cloudflared/abc123-def456-ghi789.json
Created tunnel petamini with id abc123-def456-ghi789
```

## Step 3: Configure the Tunnel

### Create configuration file:

```bash
# Create config directory if it doesn't exist
mkdir -p ~/.cloudflared

# Create the configuration file
nano ~/.cloudflared/config.yml
```

### Add this configuration (replace TUNNEL-ID with your actual tunnel ID):

```yaml
tunnel: TUNNEL-ID
credentials-file: /home/ubuntu/.cloudflared/TUNNEL-ID.json

ingress:
  - hostname: petamini.trycloudflare.com
    service: http://localhost:80
  - service: http_status:404
```

**OR if you have a custom domain on Cloudflare:**

```yaml
tunnel: TUNNEL-ID
credentials-file: /home/ubuntu/.cloudflared/TUNNEL-ID.json

ingress:
  - hostname: app.yourdomain.com
    service: http://localhost:80
  - service: http_status:404
```

Save and exit (Ctrl+X, Y, Enter)

## Step 4: Create DNS Route

### Option A: Without Custom Domain (Free subdomain)

```bash
# Route tunnel to a subdomain
cloudflared tunnel route dns petamini petamini.trycloudflare.com
```

### Option B: With Custom Domain (requires domain on Cloudflare)

```bash
# First, add your domain to Cloudflare (if not already)
# Then run:
cloudflared tunnel route dns petamini app.yourdomain.com
```

## Step 5: Run Tunnel as a Service (Auto-start on boot)

### Install as a system service:

```bash
# Install the service
sudo cloudflared service install

# Start the service
sudo systemctl start cloudflared

# Enable auto-start on boot
sudo systemctl enable cloudflared

# Check status
sudo systemctl status cloudflared
```

## Step 6: Verify It's Working

```bash
# Check tunnel status
cloudflared tunnel list

# Check tunnel info
cloudflared tunnel info petamini

# Test your URL
curl https://petamini.trycloudflare.com/health
curl https://petamini.trycloudflare.com/api/linkers
```

## Step 7: Update Your Application

### Update backend/.env on EC2:

```bash
cd ~/petamini

# Update FRONTEND_URL with your permanent tunnel URL
sed -i 's|FRONTEND_URL=.*|FRONTEND_URL=http://localhost:5173,https://petamini.trycloudflare.com|' backend/.env

# Restart containers
docker-compose down
docker-compose up -d --build
```

### Update local .env.local (on your dev machine):

```properties
VITE_API_BASE_URL=https://petamini.trycloudflare.com/api
```

## Troubleshooting

### Check tunnel logs:
```bash
sudo journalctl -u cloudflared -f
```

### Restart tunnel:
```bash
sudo systemctl restart cloudflared
```

### Check tunnel status:
```bash
cloudflared tunnel list
sudo systemctl status cloudflared
```

## Benefits of Named Tunnel:

✅ **Permanent URL** - Never changes
✅ **Auto-restart** - Starts automatically on system boot
✅ **Free HTTPS** - Cloudflare handles SSL
✅ **Better performance** - More stable than quick tunnels
✅ **Production ready** - No uptime limitations

## Quick Reference Commands:

```bash
# List all tunnels
cloudflared tunnel list

# Check tunnel info
cloudflared tunnel info petamini

# View tunnel logs
sudo journalctl -u cloudflared -f

# Restart tunnel
sudo systemctl restart cloudflared

# Stop tunnel
sudo systemctl stop cloudflared

# Start tunnel
sudo systemctl start cloudflared

# Delete tunnel (if needed)
cloudflared tunnel delete petamini
```

## Next Steps After Setup:

1. Update your Telegram bot's webhook URL (if using webhooks)
2. Update any hardcoded URLs in your app
3. Test all functionality through the new URL
4. Consider adding custom domain for branding

---

**Your permanent tunnel URL will be:**
- Without domain: `https://petamini.trycloudflare.com`
- With domain: `https://app.yourdomain.com`
