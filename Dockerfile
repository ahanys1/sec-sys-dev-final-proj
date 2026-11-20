FROM node:26-alpine@sha256:6bd9ab43c0ec0190ca7b2d193906cb8b7edf6e7f4afa43ddeccd6452710bffb5 AS base
WORKDIR /app

FROM base AS deps
# Prisma's schema engine needs openssl; fetch its binary at build time (the migrate job has no internet).
RUN apk add --no-cache openssl
COPY package.json package-lock.json prisma.config.ts ./
COPY prisma ./prisma
# Optional: on a network that inspects TLS, EXTRA_CA_CERT (a PEM file) lets Prisma download its engine.
RUN --mount=type=secret,id=extra_ca \
    if [ -s /run/secrets/extra_ca ]; then export NODE_EXTRA_CA_CERTS=/run/secrets/extra_ca; fi; \
    npm ci && npx prisma --version

FROM deps AS build
COPY . .
# T-47, V15.2.3: Turbopack writes server-side source maps; none belong in the image.
RUN npm run build && find .next -name '*.map' -type f -delete

# One-off operator tools (create-admin): source and dev dependencies, never run as a service (NH-4).
FROM build AS ops
USER node
CMD ["npx", "tsx", "scripts/create-admin.ts"]

# Migration job image: Prisma CLI, owner credentials supplied at run time only.
FROM deps AS migrate
RUN chown -R node:node /app
USER node
CMD ["npx", "prisma", "migrate", "deploy"]

# Runtime image: non-root, production build, no secrets or source (T-61).
FROM base AS runner
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 HOSTNAME=0.0.0.0 PORT=3000
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
USER node
EXPOSE 3000
CMD ["node", "server.js"]
