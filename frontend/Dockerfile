# Stage 1: Build the React application
FROM node:18-alpine as build

# Backend server base URL
ARG REACT_APP_SERVER_BASE_URL

# Set the environment variable for the server base URL
ENV REACT_APP_SERVER_BASE_URL=${REACT_APP_SERVER_BASE_URL}

# Backend server base URL
ARG REACT_APP_SERVER_WEBSOCKET_URL

# Set the environment variable for the server base URL
ENV REACT_APP_SERVER_WEBSOCKET_URL=${REACT_APP_SERVER_WEBSOCKET_URL}


# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json (or yarn.lock) into the container
COPY package*.json ./

# Install the project dependencies
RUN npm install

# Copy the rest of your app's source code from your host to your image filesystem.
COPY . .

# Build the React application
RUN npm run build

# Stage 2: Serve the application with Nginx
FROM nginx:alpine

# Copy the build output to replace the default nginx contents.
COPY --from=build /app/build /usr/share/nginx/html

# Copy your custom nginx configuration
COPY nginx/default.conf /etc/nginx/conf.d/default.conf

# Expose port 80 and 443 to the host
EXPOSE 80 443

# Start Nginx and keep it running
CMD ["nginx", "-g", "daemon off;"]