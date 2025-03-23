# Use an official Node.js image
FROM node:18

# Set the working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy environment file
COPY .env .

# Copy application code
COPY . .

# Build the React app
RUN npm run build

# Expose frontend port
EXPOSE 3000

# Serve the application
CMD ["npx", "serve", "-s", "build", "-l", "3000"]
