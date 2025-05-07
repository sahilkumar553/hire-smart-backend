FROM node:18-slim

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy the rest of the backend code
COPY . .

# Expose the port the app runs on
EXPOSE 3000

# Set NODE_ENV to production
ENV NODE_ENV=production

# Command to run the application
CMD ["node", "index.js"] 