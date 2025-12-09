FROM node:20-alpine

WORKDIR /app

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

# Copy package files and prisma schema first
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies (this will run prisma generate via postinstall)
# Install dependencies (this will run prisma generate via postinstall)
RUN npm install -g npm@latest \
    && cd /usr/local/lib/node_modules/npm \
    && npm install cross-spawn@7.0.6 \
    && cd /app \
    && npm install

# Copy the rest of the application
COPY . .

CMD ["npm", "run", "dev"]
