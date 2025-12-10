FROM node:25-slim

WORKDIR /app

# Install OpenSSL for Prisma
RUN apt-get update -y && apt-get install -y openssl ca-certificates

# Copy package files and prisma schema first
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies (this will run prisma generate via postinstall)
RUN npm install -g npm@latest && npm install

# Copy the rest of the application
COPY . .

CMD ["npm", "run", "dev"]
