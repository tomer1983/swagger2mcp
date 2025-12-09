FROM node:20-slim

WORKDIR /app

COPY package*.json ./

# Explicitly patch global cross-spawn to fix CVE-2024-21538
RUN npm install -g npm@latest && \
    cd /usr/local/lib/node_modules/npm && \
    npm install cross-spawn@7.0.6 && \
    cd /app && \
    npm install

COPY . .

CMD ["npm", "run", "dev", "--", "--host"]
