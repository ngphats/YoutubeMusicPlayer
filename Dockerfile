FROM node:20-alpine

RUN apk update

WORKDIR /app

# Copy package.json và package-lock.json nếu có
COPY package*.json ./

RUN npm install
RUN npm install -g nodemon

# Copy toàn bộ source code (đã loại trừ node_modules nhờ .dockerignore)
COPY . .