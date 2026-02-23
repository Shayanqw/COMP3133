FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY src ./src
COPY scripts ./scripts

EXPOSE 8081

CMD ["node", "src/server.js"]
