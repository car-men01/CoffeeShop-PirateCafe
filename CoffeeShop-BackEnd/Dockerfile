FROM node:18

WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json ./
RUN npm install

# Copy the rest of the application
COPY . .

# Fix line endings and make the script executable within the Docker container
RUN sed -i 's/\r$//' docker-entrypoint.sh && \
    chmod +x docker-entrypoint.sh

# Expose the API port
EXPOSE 5000
# Expose the WebSocket port
EXPOSE 5001

# Use the entry point script
ENTRYPOINT ["/bin/sh", "./docker-entrypoint.sh"]