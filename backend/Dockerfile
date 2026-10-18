FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY server.js ./
RUN mkdir -p data
EXPOSE 10000
ENV PORT=10000
ENV NODE_ENV=production
CMD ["node", "server.js"]
