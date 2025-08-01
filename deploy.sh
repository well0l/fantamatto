#!/bin/bash

# 🌀 FANTAMATTO - Script di Deploy Rapido
# Per aggiornamenti rapidi senza reinstallazione completa

set -e

APP_DIR="/opt/fantamatto"
APP_USER="fantamatto"

# Colori
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

echo "🌀 FANTAMATTO - Deploy Rapido"
echo "============================="

# Controlla se l'app è già installata
if [ ! -d "$APP_DIR" ]; then
    log_error "Fantamatto non è installato. Esegui prima setup.sh"
    exit 1
fi

cd $APP_DIR

# 1. Pull aggiornamenti
log_info "📥 Pull aggiornamenti da Git..."
sudo -u $APP_USER git pull

# 2. Aggiorna backend
log_info "🔧 Aggiornamento backend..."
sudo -u $APP_USER bash -c "cd backend && source venv/bin/activate && pip install -r requirements.txt"

# 3. Aggiorna frontend
log_info "🎨 Aggiornamento frontend..."
sudo -u $APP_USER bash -c "cd frontend && yarn install"

# 4. Build frontend
log_info "🏗️ Build frontend..."
sudo -u $APP_USER bash -c "cd frontend && yarn build"

# 5. Riavvia servizi
log_info "🔄 Riavvio servizi..."
sudo -u $APP_USER pm2 restart all

# 6. Verifica salute
log_info "🏥 Verifica salute servizi..."
sleep 5

if sudo -u $APP_USER pm2 list | grep -q "online"; then
    log_success "✅ Deploy completato con successo!"
    
    echo
    echo "📊 STATO SERVIZI:"
    sudo -u $APP_USER pm2 status
    
    echo
    echo "🌐 Applicazione disponibile su:"
    echo "   http://$(curl -s ifconfig.me 2>/dev/null || echo 'YOUR_SERVER_IP')"
else
    log_error "❌ Alcuni servizi potrebbero avere problemi"
    sudo -u $APP_USER pm2 status
    exit 1
fi

log_success "🌀 Deploy completato! L'app è aggiornata e funzionante."