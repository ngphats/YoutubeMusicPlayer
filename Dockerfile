FROM node:13-alpine

RUN apk update

WORKDIR /app
COPY package.json .

RUN npm install
RUN npm install -g nodemon

COPY . .