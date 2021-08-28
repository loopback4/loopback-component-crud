FROM node:alpine AS install
WORKDIR /srv
COPY ./package*.json ./
RUN npm ci

FROM node:alpine AS debug
WORKDIR /srv
COPY . .
COPY --from=install /srv/node_modules ./node_modules
EXPOSE 9229
CMD npm run start

FROM node:alpine AS release
WORKDIR /srv
COPY . .
COPY --from=install /srv/node_modules ./node_modules
RUN npm run build && npm run test && npm run publish
