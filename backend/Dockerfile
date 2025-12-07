FROM node:20-alpine

WORKDIR /app

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

# Copy package files and prisma schema first
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies (this will run prisma generate via postinstall)
RUN npm install

# Copy the rest of the application
COPY . .

CMD ["npm", "run", "dev"]
