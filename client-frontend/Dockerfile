FROM node:24-alpine as build
WORKDIR /app

COPY package.json ./
RUN npm install
RUN npm install -g @angular/cli

COPY . ./
RUN ng build

FROM nginx:latest
COPY --from=build /app/dist/client-frontend /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]