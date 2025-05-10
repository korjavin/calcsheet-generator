# Use a lightweight Nginx image
FROM nginx:alpine

# Copy static assets to the default Nginx public directory
COPY index.html /usr/share/nginx/html/
COPY style.css /usr/share/nginx/html/
COPY app.js /usr/share/nginx/html/
COPY math_generator.js /usr/share/nginx/html/

# Expose port 80
EXPOSE 80

# Default CMD from nginx:alpine will start nginx