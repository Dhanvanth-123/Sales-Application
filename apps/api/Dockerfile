# ── build stage ──
FROM node:22-slim AS build
RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*
RUN corepack enable
WORKDIR /repo

# install with the full workspace context (shared package is a dependency)
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml .npmrc tsconfig.base.json ./
COPY packages/shared ./packages/shared
COPY apps/api ./apps/api
RUN pnpm install --frozen-lockfile

RUN pnpm --filter @caliper/shared build \
 && pnpm --filter @caliper/api db:generate \
 && pnpm --filter @caliper/api build \
 && pnpm --filter @caliper/api deploy --prod /app

# ── runtime stage ──
FROM node:22-slim AS runtime
RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app ./
COPY --from=build /repo/apps/api/dist ./dist
COPY --from=build /repo/apps/api/prisma ./prisma
EXPOSE 4000
CMD ["node", "dist/main.js"]
