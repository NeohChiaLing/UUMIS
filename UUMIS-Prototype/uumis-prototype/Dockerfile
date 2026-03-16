# Stage 1: Build the Angular application
FROM node:20 AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build --configuration=production

# Stage 2: Serve the app with Nginx
FROM nginx:alpine
# --- ADD THIS NEW LINE ---
COPY nginx.conf /etc/nginx/conf.d/default.conf
# -------------------------
COPY --from=build /app/dist/uumis-prototype/browser /usr/share/nginx/html
EXPOSE 80
