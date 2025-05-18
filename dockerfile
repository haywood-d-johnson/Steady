FROM node:18

WORKDIR /app

COPY package.json yarn.lock* package-lock.json* ./

RUN if [ -f yarn.lock ]; then yarn install; else npm install; fi

COPY . .

ENV EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0

CMD ["npx", "expo", "start", "-c"]
