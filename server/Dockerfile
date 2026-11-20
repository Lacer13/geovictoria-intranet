FROM node:22-alpine
WORKDIR /app
COPY server/package.json server/package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts --no-audit --no-fund
COPY server/arena.mjs ./server/arena.mjs
COPY src/game/arenaSimulation.js ./src/game/arenaSimulation.js
ENV NODE_ENV=production PORT=8080
USER node
EXPOSE 8080
CMD ["node", "server/arena.mjs"]
