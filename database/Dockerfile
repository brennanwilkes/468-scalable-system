# Use an official MongoDB image as a parent image
FROM mongo:6

# Copy the custom configuration file to the container
COPY mongodb.conf /etc/mongodb.conf

# Expose the default MongoDB port (27017) for incoming traffic
EXPOSE 27017

# Run MongoDB with the custom configuration file
CMD ["mongod", "--config", "/etc/mongodb.conf"]
