FROM node:20-alpine
WORKDIR /app

# Copy packages and install dependencies
COPY backend/package*.json ./
RUN npm install --production

# Copy backend source code
COPY backend/ .

# Copy lambda and templates folders
COPY lambda/ ../lambda/
COPY templates/ ../templates/

EXPOSE 5000
CMD ["node", "server.js"]
