FROM node:20-alpine

RUN npm install -g pnpm@9.3.0

WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

ENV VITE_API_URL=https://api.hudori.app
ENV VITE_API_WS_URL=wss://api.hudori.app
ENV VITE_LIVEKIT_URL=wss://livekit.hudori.app
ENV VITE_COOKIE_DOMAIN=hudori.app
RUN pnpm build

EXPOSE 3000
CMD ["node", "build"]
