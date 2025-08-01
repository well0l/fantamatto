#!/bin/bash

# 🌀 FANTAMATTO - Setup Automatico per VPS Debian/Ubuntu
# Esegui con: curl -sSL https://raw.githubusercontent.com/TUO_USERNAME/fantamatto/main/setup.sh | bash

set -e

echo "🌀 FANTAMATTO - Setup Automatico"
echo "=================================="

# Colori per output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funzioni helper
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Variabili di configurzione
APP_NAME="fantamatto"
APP_USER="fantamatto"
APP_DIR="/opt/fantamatto"
DOMAIN="${DOMAIN:-localhost}"  # Usa variabile ambiente o default
ADMIN_PASSWORD="${ADMIN_PASSWORD:-fantamatto2025}"

# Controlla se è root
if [[ $EUID -eq 0 ]]; then
   log_error "Non eseguire questo script come root!"
   exit 1
fi

log_info "Inizio setup per $DOMAIN"

# 1. Aggiorna sistema
log_info "📦 Aggiornamento sistema..."
sudo apt update && sudo apt upgrade -y

# 2. Installa dipendenze base
log_info "🔧 Installazione dipendenze base..."
sudo apt install -y curl wget git unzip software-properties-common apt-transport-https ca-certificates gnupg lsb-release

# 3. Installa Node.js 18.x
log_info "📦 Installazione Node.js..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 4. Installa Yarn
log_info "📦 Installazione Yarn..."
curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | sudo apt-key add -
echo "deb https://dl.yarnpkg.com/debian/ stable main" | sudo tee /etc/apt/sources.list.d/yarn.list
sudo apt update && sudo apt install -y yarn

# 5. Installa Python 3 e pip
log_info "🐍 Installazione Python..."
sudo apt install -y python3 python3-pip python3-venv python3-dev

# 6. Installa MongoDB
log_info "🗄️ Installazione MongoDB..."
curl -fsSL https://www.mongodb.org/static/pgp/server-6.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-6.0.gpg --dearmor
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-6.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt update
sudo apt install -y mongodb-org

# Avvia e abilita MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# 7. Installa Nginx
log_info "🌐 Installazione Nginx..."
sudo apt install -y nginx

# 8. Installa PM2 globalmente
log_info "🔄 Installazione PM2..."
sudo npm install -g pm2

# 9. Crea utente applicazione
log_info "👤 Creazione utente applicazione..."
if ! id "$APP_USER" &>/dev/null; then
    sudo useradd -m -s /bin/bash $APP_USER
    sudo usermod -aG www-data $APP_USER
fi

# 10. Crea directory applicazione
log_info "📁 Creazione directory applicazione..."
sudo mkdir -p $APP_DIR
sudo chown $APP_USER:$APP_USER $APP_DIR

# 11. Clona repository (se non esiste già)
if [ ! -d "$APP_DIR/.git" ]; then
    log_info "📥 Clone repository..."
    if [ -z "$GITHUB_REPO" ]; then
        log_warning "Variabile GITHUB_REPO non impostata. Creando struttura manuale..."
        sudo -u $APP_USER mkdir -p $APP_DIR/backend $APP_DIR/frontend/src/components/ui $APP_DIR/logs
    else
        sudo -u $APP_USER git clone $GITHUB_REPO $APP_DIR
    fi
fi

# Assicurati che le directory esistano
sudo -u $APP_USER mkdir -p $APP_DIR/backend $APP_DIR/frontend/src/components/ui $APP_DIR/logs

# 12. Configura backend
log_info "🔧 Configurazione backend..."
cd $APP_DIR

# Crea file requirements.txt se non esiste
if [ ! -f "backend/requirements.txt" ]; then
    sudo -u $APP_USER tee backend/requirements.txt > /dev/null << 'EOF'
fastapi==0.104.1
uvicorn==0.24.0
motor==3.3.2
pydantic==2.5.0
python-dotenv==1.0.0
python-multipart==0.0.6
EOF
fi

# Crea .env backend
sudo -u $APP_USER tee backend/.env > /dev/null << EOF
MONGO_URL=mongodb://localhost:27017
DB_NAME=fantamatto_db
EOF

# Crea virtual environment e installa dipendenze
sudo -u $APP_USER python3 -m venv backend/venv
sudo -u $APP_USER bash -c "cd backend && source venv/bin/activate && pip install -r requirements.txt"

# 13. Configura frontend
log_info "🎨 Configurazione frontend..."

# Crea package.json se non esiste
if [ ! -f "frontend/package.json" ]; then
    sudo -u $APP_USER cat > frontend/package.json << 'EOF'
{
  "name": "fantamatto-frontend",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.8.1",
    "axios": "^1.6.2",
    "lucide-react": "^0.294.0",
    "@radix-ui/react-slot": "^1.0.2",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.0.0",
    "tailwind-merge": "^2.0.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.2.1",
    "vite": "^5.0.8",
    "tailwindcss": "^3.3.6",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.32"
  },
  "scripts": {
    "dev": "vite --host 0.0.0.0 --port 3000",
    "build": "vite build",
    "preview": "vite preview --host 0.0.0.0 --port 3000"
  }
}
EOF
fi

# Crea .env frontend
sudo -u $APP_USER cat > frontend/.env << EOF
REACT_APP_BACKEND_URL=http://$DOMAIN:8000
EOF

# Crea vite.config.js
sudo -u $APP_USER cat > frontend/vite.config.js << 'EOF'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3000
  },
  build: {
    outDir: 'dist'
  }
})
EOF

# Installa dipendenze frontend
sudo -u $APP_USER bash -c "cd frontend && yarn install"

# 14. Configura PM2
log_info "🔄 Configurazione PM2..."
sudo -u $APP_USER cat > $APP_DIR/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'fantamatto-backend',
      script: 'backend/venv/bin/uvicorn',
      args: 'server:app --host 0.0.0.0 --port 8000',
      cwd: '/opt/fantamatto',
      interpreter: 'none',
      env: {
        NODE_ENV: 'production'
      }
    },
    {
      name: 'fantamatto-frontend',
      script: 'yarn',
      args: 'preview',
      cwd: '/opt/fantamatto/frontend',
      interpreter: 'none',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    }
  ]
}
EOF

# 15. Build frontend
log_info "🏗️ Build frontend..."
sudo -u $APP_USER bash -c "cd frontend && yarn build"

# 16. Configura Nginx
log_info "🌐 Configurazione Nginx..."
sudo cat > /etc/nginx/sites-available/fantamatto << EOF
server {
    listen 80;
    server_name $DOMAIN;

    # Frontend (React)
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
}
EOF

# Abilita sito
sudo ln -sf /etc/nginx/sites-available/fantamatto /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test configurazione nginx
sudo nginx -t

# 17. Configura firewall
log_info "🔒 Configurazione firewall..."
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw --force enable

# 18. Avvia servizi
log_info "🚀 Avvio servizi..."

# Riavvia nginx
sudo systemctl restart nginx
sudo systemctl enable nginx

# Avvia applicazioni con PM2
sudo -u $APP_USER bash -c "cd $APP_DIR && pm2 start ecosystem.config.js"
sudo -u $APP_USER pm2 save
sudo -u $APP_USER pm2 startup systemd -u $APP_USER --hp /home/$APP_USER

# 19. Crea script di aggiornamento
log_info "📝 Creazione script di aggiornamento..."
sudo cat > /usr/local/bin/fantamatto-update << 'EOF'
#!/bin/bash
cd /opt/fantamatto
sudo -u fantamatto git pull
sudo -u fantamatto bash -c "cd backend && source venv/bin/activate && pip install -r requirements.txt"
sudo -u fantamatto bash -c "cd frontend && yarn install && yarn build"
sudo -u fantamatto pm2 restart all
echo "✅ Fantamatto aggiornato!"
EOF

sudo chmod +x /usr/local/bin/fantamatto-update

# 20. Crea script di monitoraggio
sudo cat > /usr/local/bin/fantamatto-status << 'EOF'
#!/bin/bash
echo "🌀 FANTAMATTO STATUS"
echo "==================="
echo
echo "📊 Servizi PM2:"
sudo -u fantamatto pm2 status
echo
echo "🗄️ MongoDB:"
sudo systemctl status mongod --no-pager -l
echo
echo "🌐 Nginx:"
sudo systemctl status nginx --no-pager -l
echo
echo "🔗 URL: http://$(curl -s ifconfig.me || echo 'YOUR_IP')"
EOF

sudo chmod +x /usr/local/bin/fantamatto-status

# 21. Setup completato
log_success "🎉 Setup completato!"
echo
echo "📍 INFORMAZIONI IMPORTANTI:"
echo "=========================="
echo "🌐 URL Applicazione: http://$DOMAIN"
echo "🔑 Password Admin: $ADMIN_PASSWORD"
echo "📁 Directory App: $APP_DIR"
echo "👤 Utente App: $APP_USER"
echo
echo "📋 COMANDI UTILI:"
echo "================"
echo "• Stato servizi: fantamatto-status"
echo "• Aggiorna app: fantamatto-update"
echo "• Log PM2: sudo -u $APP_USER pm2 logs"
echo "• Riavvia app: sudo -u $APP_USER pm2 restart all"
echo
echo "🚀 L'applicazione dovrebbe essere accessibile a:"
echo "   http://$(curl -s ifconfig.me 2>/dev/null || echo 'YOUR_SERVER_IP')"
echo
log_success "🌀 FANTAMATTO è pronto per la caccia ai matti di Ponza! 🏝️"