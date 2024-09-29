FROM node:18-bullseye-slim

# Install necessary dependencies
RUN apt-get update && apt-get install -y \
    chromium \
    && rm -rf /var/lib/apt/lists/*

# Set environment variables
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app

COPY package*.json ./
COPY tsconfig.json ./
COPY config.json ./

RUN npm install

# Copy only the necessary files, excluding node_modules
COPY src ./src
COPY public ./public

# Use nodemon with ts-node for hot reloading
CMD ["npx", "nodemon", "--exec", "ts-node", "src/bot.ts"]

# Expose the port the app runs on
EXPOSE 3000