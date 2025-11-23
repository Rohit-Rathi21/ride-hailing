FROM node:18

WORKDIR /app

# Only copy package.json now
COPY package.json ./

# Fresh install (no cache, no old body-parser)
RUN npm install --production

# Then copy your service code
COPY . .

EXPOSE 3001

CMD ["node", "index.js"]
