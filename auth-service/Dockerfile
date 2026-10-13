FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json* tsconfig.json tsconfig.build.json ./
RUN npm install

COPY src ./src
RUN npm run build && npm prune --omit=dev

FROM node:20-alpine
WORKDIR /app

COPY --from=build /app/package.json ./package.json
COPY --from=build /app/package-lock.json ./package-lock.json
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist

EXPOSE 4000
CMD ["npm", "start"]
