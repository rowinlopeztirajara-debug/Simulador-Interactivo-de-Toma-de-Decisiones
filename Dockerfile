FROM nginx:alpine

# Copiar archivos del proyecto
COPY index.html /usr/share/nginx/html/
COPY style.css /usr/share/nginx/html/
COPY script.js /usr/share/nginx/html/
COPY health.json /usr/share/nginx/html/
COPY public/ /usr/share/nginx/html/public/

# Exponer puerto
EXPOSE 80

# Health check para Docker
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/health || exit 1

CMD ["nginx", "-g", "daemon off;"]