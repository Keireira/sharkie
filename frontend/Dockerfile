# Stage 1: Install dependencies
FROM node:22-alpine AS deps

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app
COPY package.json pnpm-lock.yaml .npmrc ./
RUN pnpm install --frozen-lockfile

# Stage 2: Build
FROM node:22-alpine AS build

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG API_BASE=http://SHARKIE-APP:3000
ARG NEXT_PUBLIC_API_BASE=/api/proxy
ENV API_BASE=${API_BASE}
ENV NEXT_PUBLIC_API_BASE=${NEXT_PUBLIC_API_BASE}

RUN pnpm build

# Stage 3: Production
FROM node:22-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

COPY --from=build /app/public ./public
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static

EXPOSE 3000
CMD ["node", "server.js"]
