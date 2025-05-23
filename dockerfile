FROM node:18-slim

WORKDIR /app

# Install system dependencies including SQLite and curl for healthcheck
RUN apt-get update && apt-get install -y \
    sqlite3 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install dependencies first for better caching
COPY package*.json ./
COPY yarn.lock* ./

# Install dependencies based on lock file
RUN if [ -f yarn.lock ]; then yarn install --frozen-lockfile; \
    else npm ci; \
    fi

# Install expo-cli globally
RUN npm install -g expo-cli@latest

# Copy the rest of the application
COPY . .

# Set environment variables
ENV EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0
ENV REACT_NATIVE_PACKAGER_HOSTNAME=localhost
ENV NODE_ENV=development

# Create data directory for SQLite
RUN mkdir -p /app/data

# Expose necessary ports
EXPOSE 19000 19001 19002

# Start the application
CMD ["npx", "expo", "start", "--web", "--clear", "--no-dev-client"]
