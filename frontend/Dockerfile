# Use an official Node.js runtime as a parent image
FROM node:18-alpine AS builder

# Install pnpm globally
RUN npm install -g pnpm

# Set the working directory to /app
WORKDIR /app

# Copy package.json and pnpm-lock.yaml to the working directory
COPY package.json pnpm-lock.yaml ./

# Install dependencies using pnpm
RUN pnpm install --prefer-frozen-lockfile

# Copy the rest of the application code to the working directory
COPY . .

# Build the production-ready frontend using pnpm
RUN pnpm run build

# Use an official nginx runtime as a parent image
FROM nginx:1.21.3-alpine

# Copy the built frontend files to the nginx webroot
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose the container's port 80 for incoming traffic
EXPOSE 80

# Start nginx in the foreground when the container is run
CMD ["nginx", "-g", "daemon off;"]
