FROM node:18 as build

WORKDIR /app

# Copy package files first (this is important for caching)
COPY package.json package-lock.json ./

# Install ALL dependencies including dev dependencies needed for building
RUN npm install

# Install react-icons explicitly
RUN npm install react-icons --save

# Copy the rest of the application
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]