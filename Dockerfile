FROM node:19

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . ./

EXPOSE 5050

CMD ["npm", "run", "start:prod"]
