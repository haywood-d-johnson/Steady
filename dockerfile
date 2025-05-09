FROM node:18-bullseye

# Set working directory
WORKDIR /app

# Install Expo CLI globally (for cache clearing and CLI commands)
RUN npm install -g expo-cli

# Copy dependencies
COPY package.json package-lock.json ./

# Install project dependencies
RUN npm install

# Copy the rest of the app
COPY . .

# Expose Expo ports (adjust if needed)
EXPOSE 8081 19000 19001 19002

# Start Expo with clear cache
CMD ["npx", "expo", "start", "-c"]
