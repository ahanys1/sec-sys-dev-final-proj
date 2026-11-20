FROM node:24-alpine@sha256:116b800c3754b440ee0aa3ed2f20f5bf3d99a554bfd9adeea09ea8017f6e85f5 AS base
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
