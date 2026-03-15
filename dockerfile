# -------- Build Stage --------
FROM node:20-alpine AS builder

WORKDIR /app

# instala dependências primeiro (melhor cache)
COPY package*.json ./
RUN npm install

# copia código
COPY . .

# build
RUN npm run build


# -------- Production Stage --------
FROM nginx:stable-alpine

# remove config padrão
RUN rm -rf /usr/share/nginx/html/*

# copia build do react
COPY --from=builder /app/dist /usr/share/nginx/html

# copia config otimizada
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]