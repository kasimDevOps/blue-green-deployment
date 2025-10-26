# Use official Node.js image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy only package files first (for better caching)
COPY package*.json ./

# Install only production dependencies
RUN npm install --production

# Copy the rest of the app
COPY . .

# Expose application port
EXPOSE 5000

# Run the app
CMD ["node", "index.js"]
