FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install -g npm@latest \
    && cd /usr/local/lib/node_modules/npm \
    && npm install cross-spawn@7.0.6 \
    && cd /app \
    && npm install

COPY . .

CMD ["npm", "run", "dev", "--", "--host"]
