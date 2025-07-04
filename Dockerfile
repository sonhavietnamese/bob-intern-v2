# Use the official Node.js image
FROM node:20-slim

# Set working directory
WORKDIR /app

# Install Chrome, build tools, and dependencies in one layer
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    ca-certificates \
    python3 \
    python3-pip \
    build-essential \
    gcc \
    g++ \
    make \
    fonts-liberation \
    libappindicator3-1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libc6 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgbm1 \
    libgcc1 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libstdc++6 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    lsb-release \
    xdg-utils \
    fonts-ipafont-gothic \
    fonts-wqy-zenhei \
    fonts-thai-tlwg \
    fonts-kacst \
    fonts-freefont-ttf \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
    && apt-get update \
    && apt-get install -y google-chrome-stable \
    && rm -rf /var/lib/apt/lists/*

# Install pnpm globally
RUN npm install -g pnpm

# Set Puppeteer environment variables before installing dependencies
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

# Copy package files first for better caching
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Install dependencies with pnpm
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Copy and make entry script executable
COPY entry.sh ./
RUN chmod +x entry.sh

# Build the TypeScript project
RUN pnpm run build

# Create a non-root user for security
RUN groupadd --system --gid 1001 botgroup
RUN useradd --system --uid 1001 --gid botgroup --create-home botuser

# Change ownership of the app directory
RUN chown -R botuser:botgroup /app
USER botuser

# Set production environment
ENV NODE_ENV=production

# Define build arguments
ARG PORT=3501
ARG TELEGRAM_BOT_TOKEN
ARG RAILWAY_PUBLIC_DOMAIN
ARG RAILWAY_PRIVATE_DOMAIN
ARG RAILWAY_TCP_PROXY_PORT
ARG RAILWAY_PROJECT_ID
ARG RAILWAY_SERVICE_ID
ARG RAILWAY_STATIC_URL

# Set PORT environment variable from build arg
ENV PORT=${PORT}

# Expose the port that the app runs on
EXPOSE ${PORT}

# Start the application using the entry script
CMD ["./entry.sh"] 