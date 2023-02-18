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

# Build the TypeScript code using SWC
RUN pnpm run build

#Prune away build deps
RUN pnpm prune --prod


# Use an official Alpine-based Node.js runtime as a parent image
FROM node:18-alpine

# Set the working directory to /app
WORKDIR /app

# Copy the built code from the previous stage to the working directory
COPY --from=builder /app/dist /app
COPY --from=builder /app/package.json /app/pnpm-lock.yaml ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./

# Expose the container's port 3000 for incoming traffic
EXPOSE 3001

# Start the web server in the foreground when the container is run
CMD ["node", "index.js"]
