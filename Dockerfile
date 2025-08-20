# --- Fáze 1: Sestavení klienta (Frontend) ---
# Použijeme plnou verzi Node.js pro sestavení
FROM node:20 AS builder

# Nastavíme pracovní adresář
WORKDIR /app

# Zkopírujeme package.json soubory klienta a nainstalujeme závislosti
# Děláme to zvlášť, aby Docker mohl využít cache a zrychlit budoucí buildy
COPY client/package*.json ./client/
RUN cd client && npm install

# Zkopírujeme zbytek kódu klienta
COPY client/ ./client/

# Spustíme build skript, který vytvoří složku /app/client/dist
RUN cd client && npm run build


# --- Fáze 2: Finální produkční image ---
# Použijeme menší "alpine" verzi Node.js pro menší výslednou velikost
FROM node:20-alpine

WORKDIR /app

# Zkopírujeme package.json soubory serveru a nainstalujeme POUZE produkční závislosti
COPY server/package*.json ./
RUN npm install --production

# Zkopírujeme zbytek kódu serveru
COPY server/ ./

# Z Fáze 1 (builder) zkopírujeme sestavenou klientskou aplikaci
# do složky 'public' uvnitř našeho serveru
COPY --from=builder /app/client/dist ./public

# Otevřeme port, na kterém běží náš Express server
EXPOSE 3001

# Příkaz pro spuštění serveru
CMD ["node", "index.js"]