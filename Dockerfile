FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY scripts/prepare.mjs ./scripts/prepare.mjs
RUN npm ci
COPY . .
# NEXT_PUBLIC_* vars are inlined into the client bundle at build time, so this
# must be a build ARG — setting it as a runtime `environment:` var in compose
# has no effect on an already-built Next.js app.
ARG NEXT_PUBLIC_GRAPHQL_URL
ARG NEXT_PUBLIC_REGISTRY_CONTRACT_ID
ARG NEXT_PUBLIC_SOROBAN_RPC_URL
ARG NEXT_PUBLIC_NETWORK_PASSPHRASE
ARG NEXT_PUBLIC_REGISTRY_READ_ACCOUNT
ARG NEXT_PUBLIC_ERROR_REPORTING_URL
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_GRAPHQL_WS_URL
ARG NEXT_PUBLIC_VAPID_PUBLIC_KEY
ARG ERROR_REPORTING_URL
ENV NEXT_PUBLIC_GRAPHQL_URL=$NEXT_PUBLIC_GRAPHQL_URL \
    NEXT_PUBLIC_REGISTRY_CONTRACT_ID=$NEXT_PUBLIC_REGISTRY_CONTRACT_ID \
    NEXT_PUBLIC_SOROBAN_RPC_URL=$NEXT_PUBLIC_SOROBAN_RPC_URL \
    NEXT_PUBLIC_NETWORK_PASSPHRASE=$NEXT_PUBLIC_NETWORK_PASSPHRASE \
    NEXT_PUBLIC_REGISTRY_READ_ACCOUNT=$NEXT_PUBLIC_REGISTRY_READ_ACCOUNT \
    NEXT_PUBLIC_ERROR_REPORTING_URL=$NEXT_PUBLIC_ERROR_REPORTING_URL \
    NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    NEXT_PUBLIC_GRAPHQL_WS_URL=$NEXT_PUBLIC_GRAPHQL_WS_URL \
    NEXT_PUBLIC_VAPID_PUBLIC_KEY=$NEXT_PUBLIC_VAPID_PUBLIC_KEY \
    ERROR_REPORTING_URL=$ERROR_REPORTING_URL
RUN npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
EXPOSE 3000
USER node
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"
CMD ["node", "server.js"]
