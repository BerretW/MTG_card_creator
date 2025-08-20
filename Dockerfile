# Dockerfile
# Stage 1: Build a React client
FROM node:18-alpine AS client-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

# Stage 2: Build and run the Node.js server
FROM node:18-alpine AS server-runner
WORKDIR /app
COPY server/package*.json ./
RUN npm install --production
COPY server/ ./

# Zkopírujte postavený front-end z první fáze
COPY --from=client-builder /app/client/dist ./client/dist

# Vytvořte adresář pro nahrávání, pokud neexistuje
RUN mkdir -p uploads

EXPOSE 3001
CMD ["node", "index.js"]