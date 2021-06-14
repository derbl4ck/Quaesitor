## Stage one: known as build step
FROM node:lts AS build
WORKDIR /usr/src/app
COPY package*.json ./
COPY . .
RUN npm install
RUN npm run build

## Stage two: app runs in production mode
FROM nginx:1.20-alpine
RUN rm -rf /usr/share/nginx/html/*
COPY ./nginx.conf /etc/nginx/nginx.conf
COPY --from=build /usr/src/app/dist /usr/share/nginx/html
EXPOSE 80

# run nginx
CMD ["nginx", "-g", "daemon off;"]
