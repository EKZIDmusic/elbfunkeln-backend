# 🚀 Elbfunkeln Backend - Deployment Guide

## 📋 Voraussetzungen

- Node.js 18+ 
- MariaDB 10.6+
- Domain mit SSL-Zertifikat
- Stripe Account
- SMTP Server (Gmail, SendGrid, etc.)

---

## 🏗️ Production Setup

### 1. Server Vorbereitung

```bash
# Update System
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 (Process Manager)
sudo npm install -g pm2

# Install Nginx
sudo apt install -y nginx

# Install MariaDB
sudo apt install -y mariadb-server
sudo mysql_secure_installation
```

### 2. Datenbank Setup

```bash
# MariaDB Console
sudo mysql -u root -p

# Erstelle Datenbank und Benutzer
CREATE DATABASE elbfunkeln CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'elbfunkeln_user'@'localhost' IDENTIFIED BY 'STRONG_PASSWORD_HERE';
GRANT ALL PRIVILEGES ON elbfunkeln.* TO 'elbfunkeln_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 3. Projekt Deploy

```bash
# Clone Repository
cd /var/www
git clone <your-repo> elbfunkeln-backend
cd elbfunkeln-backend

# Install Dependencies
npm ci --production

# Setup Environment
cp .env.example .env
nano .env
# Füge Production-Werte ein!

# Build Application
npm run build

# Setup Prisma
npx prisma generate
npx prisma db push
```

### 4. Environment Variables (Production)

```env
# Database
DATABASE_URL="mysql://elbfunkeln_user:PASSWORD@localhost:3306/elbfunkeln"

# JWT (Generate strong secret!)
JWT_SECRET="<64-character-random-string>"
JWT_EXPIRES_IN="7d"

# Stripe (Production Keys!)
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_PUBLISHABLE_KEY="pk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Email
SMTP_HOST="smtp.sendgrid.net"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="apikey"
SMTP_PASSWORD="<your-sendgrid-api-key>"
SMTP_FROM="Elbfunkeln <noreply@elbfunkeln.de>"

# App
NEXT_PUBLIC_APP_URL="https://api.elbfunkeln.de"
NODE_ENV="production"
```

### 5. PM2 Process Manager

Erstelle `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'elbfunkeln-api',
    script: 'npm',
    args: 'start',
    cwd: '/var/www/elbfunkeln-backend',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
```

Starte die App:

```bash
# Create logs directory
mkdir -p logs

# Start with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 startup script
pm2 startup
# Follow the instructions

# Monitor
pm2 monit
```

### 6. Nginx Configuration

Erstelle `/etc/nginx/sites-available/elbfunkeln-api`:

```nginx
upstream elbfunkeln_backend {
    server localhost:3000;
    keepalive 64;
}

server {
    listen 80;
    server_name api.elbfunkeln.de;
    
    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.elbfunkeln.de;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/api.elbfunkeln.de/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.elbfunkeln.de/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Rate Limiting
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
    limit_req zone=api_limit burst=20 nodelay;

    # Logging
    access_log /var/log/nginx/elbfunkeln-api.access.log;
    error_log /var/log/nginx/elbfunkeln-api.error.log;

    # Proxy Settings
    location / {
        proxy_pass http://elbfunkeln_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health Check (no rate limit)
    location /api/health {
        limit_req off;
        proxy_pass http://elbfunkeln_backend;
    }

    # Webhook (no rate limit for Stripe)
    location /api/webhooks/stripe {
        limit_req off;
        proxy_pass http://elbfunkeln_backend;
    }
}
```

Aktiviere die Konfiguration:

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/elbfunkeln-api /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### 7. SSL mit Let's Encrypt

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get Certificate
sudo certbot --nginx -d api.elbfunkeln.de

# Auto-renewal is automatic with certbot
```

### 8. Firewall Setup

```bash
# UFW Firewall
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

---

## 📊 Monitoring & Logs

### PM2 Monitoring

```bash
# Monitor processes
pm2 monit

# View logs
pm2 logs elbfunkeln-api

# Show process info
pm2 info elbfunkeln-api

# Restart
pm2 restart elbfunkeln-api

# Reload (zero-downtime)
pm2 reload elbfunkeln-api
```

### Nginx Logs

```bash
# Access logs
sudo tail -f /var/log/nginx/elbfunkeln-api.access.log

# Error logs
sudo tail -f /var/log/nginx/elbfunkeln-api.error.log
```

---

## 🔄 Deployment Updates

```bash
cd /var/www/elbfunkeln-backend

# Pull latest code
git pull origin main

# Install new dependencies
npm ci --production

# Build
npm run build

# Run migrations if needed
npx prisma migrate deploy

# Reload application (zero-downtime)
pm2 reload elbfunkeln-api
```

---

## 🔐 Security Checklist

- [ ] Starkes JWT_SECRET (min. 64 Zeichen)
- [ ] Starke Datenbank-Passwörter
- [ ] SSL/TLS aktiviert
- [ ] Firewall konfiguriert
- [ ] Rate Limiting aktiv
- [ ] Stripe Webhook Secret konfiguriert
- [ ] Produktionsmodus für alle Services
- [ ] Backup-Strategie implementiert
- [ ] Monitoring eingerichtet
- [ ] Logs rotieren (logrotate)

---

## 💾 Backup-Strategie

### Datenbank Backup

Erstelle `/usr/local/bin/backup-db.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/elbfunkeln"
DATE=$(date +%Y%m%d_%H%M%S)
FILENAME="elbfunkeln_$DATE.sql.gz"

mkdir -p $BACKUP_DIR

mysqldump -u elbfunkeln_user -p'PASSWORD' elbfunkeln | gzip > "$BACKUP_DIR/$FILENAME"

# Keep only last 7 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete

echo "Backup completed: $FILENAME"
```

Mache ausführbar und füge zu Cron hinzu:

```bash
sudo chmod +x /usr/local/bin/backup-db.sh

# Add to crontab (daily at 2am)
sudo crontab -e
# Add line:
0 2 * * * /usr/local/bin/backup-db.sh >> /var/log/backup.log 2>&1
```

---

## 🔍 Health Checks

Test die API:

```bash
# Health Check
curl https://api.elbfunkeln.de/api/health

# Version Check
curl https://api.elbfunkeln.de/api/version

# Auth Test
curl -X POST https://api.elbfunkeln.de/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

---

## 📈 Performance Optimization

### Database Optimization

```sql
-- Add indexes (already in Prisma schema, but verify)
SHOW INDEX FROM Product;
SHOW INDEX FROM Order;

-- Analyze tables
ANALYZE TABLE Product;
ANALYZE TABLE Order;
ANALYZE TABLE User;
```

### PM2 Cluster Mode

Die Konfiguration nutzt bereits Cluster Mode mit 2 Instanzen. Passe an deine Server-Ressourcen an:

```javascript
instances: 'max', // Nutzt alle CPU-Kerne
```

---

## 🚨 Troubleshooting

### App startet nicht

```bash
# Check logs
pm2 logs elbfunkeln-api --lines 50

# Check if port is in use
sudo lsof -i :3000

# Check environment
pm2 env 0
```

### Datenbank-Verbindung fehlschlägt

```bash
# Test connection
mysql -u elbfunkeln_user -p elbfunkeln

# Check Prisma
npx prisma db pull
```

### Nginx 502 Error

```bash
# Check if app is running
pm2 status

# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Test Nginx config
sudo nginx -t
```

---

## 📞 Support & Monitoring Services

**Empfohlene Tools:**
- **Sentry** - Error Tracking
- **Datadog** - Performance Monitoring
- **UptimeRobot** - Uptime Monitoring
- **LogRocket** - Session Replay

---

## ✅ Deployment Checklist

### Pre-Deployment
- [ ] Alle Tests laufen erfolgreich
- [ ] Environment-Variablen konfiguriert
- [ ] Database Migrations erstellt
- [ ] SSL-Zertifikate eingerichtet

### Deployment
- [ ] Code deployed
- [ ] Dependencies installiert
- [ ] Build erfolgreich
- [ ] Database Migrations ausgeführt
- [ ] PM2 gestartet
- [ ] Nginx konfiguriert

### Post-Deployment
- [ ] Health Check erfolgreich
- [ ] API Endpoints testen
- [ ] Logs überprüfen
- [ ] Monitoring aktiv
- [ ] Backup läuft

---

**Dein Backend ist jetzt produktionsbereit! 🚀**