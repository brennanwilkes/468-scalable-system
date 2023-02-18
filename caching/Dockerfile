# Use an official Redis image as a parent image
FROM redis:7-alpine

# Copy the custom configuration file to the container
COPY redis.conf /usr/local/etc/redis/redis.conf

# Use the custom configuration file for Redis
CMD ["redis-server", "/usr/local/etc/redis/redis.conf"]

# Expose the default Redis port (6379) for incoming traffic
EXPOSE 6379
