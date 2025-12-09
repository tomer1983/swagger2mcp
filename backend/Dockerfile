FROM node:20-slim

WORKDIR /app

# Install OpenSSL for Prisma
RUN apt-get update -y && apt-get install -y openssl ca-certificates

# Copy package files and prisma schema first
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies (this will run prisma generate via postinstall)
# Explicitly patch global cross-spawn to fix CVE-2024-21538
RUN npm install -g npm@latest && \
    cd /usr/local/lib/node_modules/npm && \
    npm install cross-spawn@7.0.6 && \
    cd /app && \
    npm install

# Copy the rest of the application
COPY . .

CMD ["npm", "run", "dev"]
