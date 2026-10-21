FROM node:22-alpine AS deps
ARG NPM_VERSION=12.2.0
WORKDIR /app

COPY package.json ./
RUN npm install -g npm@${NPM_VERSION}
RUN npm install

FROM deps AS build
WORKDIR /app

COPY nest-cli.json tsconfig.json tsconfig.build.json ./
COPY src ./src
RUN npm run build

FROM node:22-alpine AS runtime
ARG NPM_VERSION=12.2.0
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY --from=deps /app/package.json /app/package-lock.json ./
RUN npm install -g npm@${NPM_VERSION}
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build /app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/main"]