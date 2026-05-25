FROM node:22-alpine
WORKDIR /app

# Copy package files for both backend and lambda
COPY backend/package*.json ./
COPY lambda/package*.json ../lambda/

# Install dependencies for both backend and lambda
RUN npm install --production && \
    cd ../lambda && \
    npm install --production

# Copy backend source code
COPY backend/ .

# Copy lambda and templates folders
COPY lambda/ ../lambda/
COPY templates/ ../templates/

EXPOSE 5000
CMD ["node", "server.js"]
