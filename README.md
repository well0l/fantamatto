# 🌀 Fantamatto - Caccia ai Personaggi più Pazzi di Ponza

Un'applicazione web per la caccia fotografica ai personaggi più strani e divertenti dell'isola di Ponza. Gli utenti possono caricare foto, classificarle per rarità e competere in una classifica in tempo reale.

## 🚀 Deploy Automatico su VPS

### Setup con Un Comando

Per installare tutto automaticamente su una VPS Debian/Ubuntu:

```bash
curl -sSL https://raw.githubusercontent.com/TUO_USERNAME/fantamatto/main/setup.sh | bash
```

### Setup con Dominio Personalizzato

```bash
curl -sSL https://raw.githubusercontent.com/TUO_USERNAME/fantamatto/main/setup.sh | DOMAIN=tuodominio.com bash
```

### Setup con Password Admin Personalizzata

```bash
curl -sSL https://raw.githubusercontent.com/TUO_USERNAME/fantamatto/main/setup.sh | DOMAIN=tuodominio.com ADMIN_PASSWORD=tuapassword bash
```

## 🎮 Caratteristiche

- **Sistema di Login**: Accesso controllato con credenziali create dall'admin
- **Upload Foto**: Carica foto dei "matti" di Ponza con classificazione per rarità
- **Sistema Punti**: Punti basati sulla rarità (Comune=10, Raro=25, Epico=50, Leggendario=100)
- **Classifica Live**: Leaderboard in tempo reale
- **Pannello Admin**: Gestione completa di utenti e contenuti
- **Design Retro**: Ispirato ai videogiochi degli anni '80-'90

## 🔧 Gestione Server

### Comandi Utili

```bash
# Stato dei servizi
fantamatto-status

# Aggiornamento applicazione
fantamatto-update

# Log in tempo reale
sudo -u fantamatto pm2 logs

# Riavvio applicazione
sudo -u fantamatto pm2 restart all

# Monitoraggio PM2
sudo -u fantamatto pm2 monit
```

### Struttura Applicazione

```
/opt/fantamatto/
├── backend/
│   ├── server.py          # API FastAPI
│   ├── requirements.txt   # Dipendenze Python
│   ├── .env              # Configurazione backend
│   └── venv/             # Virtual environment
├── frontend/
│   ├── src/
│   │   ├── App.js        # Applicazione React principale
│   │   ├── App.css       # Stili retro gaming
│   │   └── components/   # Componenti UI
│   ├── package.json      # Dipendenze Node.js
│   ├── .env             # Configurazione frontend
│   └── dist/            # Build di produzione
└── ecosystem.config.js   # Configurazione PM2
```

## 🔑 Credenziali di Default

- **Password Admin**: `fantamatto2025`
- **Database**: MongoDB locale
- **Porte**: Frontend (3000), Backend (8000), Web (80)

## 🌐 Accesso

1. **Vai su**: `http://tuo-server-ip`
2. **Admin Panel**: Clicca sull'icona ⚙️ in alto a destra
3. **Crea Utenti**: Usa il pannello admin per creare gli account
4. **Login Utenti**: Gli utenti possono accedere con le credenziali create

## 📊 Pannello Admin

### Funzionalità

- ✅ **Gestione Utenti**: Crea, modifica, disattiva utenti
- ✅ **Gestione Matti**: Modera e elimina contenuti
- ✅ **Statistiche**: Visualizza statistiche globali
- ✅ **Reset Punti**: Reset globale dei punteggi
- ✅ **Monitoraggio**: Stato dell'applicazione

### Screenshot

Il pannello admin include:
- Dashboard con statistiche
- Lista utenti con controlli CRUD
- Galleria matti con moderazione
- Strumenti di amministrazione

## 🔧 Sviluppo Locale

### Prerequisiti

- Node.js 18+
- Python 3.8+
- MongoDB
- Yarn

### Setup Manuale

```bash
# Backend
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn server:app --reload

# Frontend
cd frontend
yarn install
yarn dev
```

## 🐛 Troubleshooting

### Problemi Comuni

**MongoDB non si avvia:**
```bash
sudo systemctl start mongod
sudo systemctl status mongod
```

**PM2 non funziona:**
```bash
sudo -u fantamatto pm2 kill
sudo -u fantamatto pm2 start ecosystem.config.js
```

**Nginx errori:**
```bash
sudo nginx -t
sudo systemctl reload nginx
```

**Aggiornamento bloccato:**
```bash
cd /opt/fantamatto
sudo -u fantamatto git reset --hard HEAD
sudo -u fantamatto git pull
fantamatto-update
```

## 📝 Log e Monitoraggio

### Visualizzare Log

```bash
# Log applicazione
sudo -u fantamatto pm2 logs

# Log specifico servizio
sudo -u fantamatto pm2 logs fantamatto-backend
sudo -u fantamatto pm2 logs fantamatto-frontend

# Log sistema
sudo journalctl -u nginx -f
sudo journalctl -u mongod -f
```

### Metriche Performance

```bash
# Stato risorse
sudo -u fantamatto pm2 monit

# Uso disco
df -h

# Uso memoria
free -h

# Processi attivi
htop
```

## 🔒 Security

### Firewall

Il setup configura automaticamente UFW:
- Porta 22 (SSH)
- Porta 80 (HTTP)
- Porta 443 (HTTPS)

### SSL/HTTPS

Per abilitare HTTPS con Let's Encrypt:

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d tuodominio.com
```

## 🆙 Aggiornamenti

### Aggiornamento Automatico

```bash
fantamatto-update
```

### Aggiornamento Manuale

```bash
cd /opt/fantamatto
sudo -u fantamatto git pull
sudo -u fantamatto bash -c "cd backend && source venv/bin/activate && pip install -r requirements.txt"
sudo -u fantamatto bash -c "cd frontend && yarn install && yarn build"
sudo -u fantamatto pm2 restart all
```

## 🤝 Contribuire

1. Fork del repository
2. Crea branch feature (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Apri una Pull Request

## 📄 Licenza

Questo progetto è distribuito sotto licenza MIT. Vedi `LICENSE` per maggiori informazioni.

## 🏝️ Credits

Fantamatto - Creato per immortalare i personaggi più pazzi dell'isola di Ponza!

---

*"L'isola è piccola, ma i personaggi sono tanti. E voi? Siete pronti a sfidarvi nella gara più epica dell'estate?"* 🌀👑