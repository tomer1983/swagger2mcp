FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install -g npm@latest \
    && cd $(npm root -g)/npm \
    && npm install cross-spawn@7.0.6 \
    && cd - \
    && npm install

COPY . .

CMD ["npm", "run", "dev", "--", "--host"]
