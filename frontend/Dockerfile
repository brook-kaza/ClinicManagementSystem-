# Stage 1: Build the frontend
FROM node:20-alpine AS build

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Expose the build to a generic volume (to be consumed by the proxy service)
# We use a lightweight image just to store the files
FROM alpine:latest
COPY --from=build /app/dist /usr/share/nginx/html

# This stage doesn't run a server, it just provides a mount point
CMD ["sh", "-c", "while true; do sleep 3600; done"]
