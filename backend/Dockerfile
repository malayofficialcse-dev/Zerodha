# Use Node.js 20 Alpine as the base image for a small footprint
FROM node:20-alpine

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies strictly
RUN npm install --production

# Copy the rest of the application code
COPY . .

# Expose the port the app runs on
EXPOSE 3005

# Start the application
CMD ["node", "server.js"]
