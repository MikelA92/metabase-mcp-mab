FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY src ./src
COPY .env .env
CMD ["node", "src/server/index.js"]

