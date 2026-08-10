FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
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
ENV NEXT_PUBLIC_GRAPHQL_URL=$NEXT_PUBLIC_GRAPHQL_URL \
    NEXT_PUBLIC_REGISTRY_CONTRACT_ID=$NEXT_PUBLIC_REGISTRY_CONTRACT_ID \
    NEXT_PUBLIC_SOROBAN_RPC_URL=$NEXT_PUBLIC_SOROBAN_RPC_URL \
    NEXT_PUBLIC_NETWORK_PASSPHRASE=$NEXT_PUBLIC_NETWORK_PASSPHRASE \
    NEXT_PUBLIC_REGISTRY_READ_ACCOUNT=$NEXT_PUBLIC_REGISTRY_READ_ACCOUNT
RUN npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/package.json /app/package-lock.json ./
RUN npm ci --omit=dev
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/next.config.ts ./
EXPOSE 3000
CMD ["npm", "start"]
