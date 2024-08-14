###################
# BUILD FOR LOCAL DEVELOPMENT
###################

FROM node:22-alpine As development

WORKDIR /usr/src/app

ENV NODE_ENV production

COPY ./package.json ./

RUN npm install

COPY . .


###################
# BUILD FOR PRODUCTION
###################

FROM node:22-alpine As build

WORKDIR /usr/src/app

ENV NODE_ENV production

COPY --from=development /usr/src/app/node_modules ./node_modules
COPY --from=development /usr/src/app/package-lock.json ./package-lock.json
COPY . .

RUN npm run build

RUN npm ci --only=production && npm cache clean --force

###################
# PRODUCTION
###################

FROM node:22-alpine As production

COPY --chown=node:node --from=build /usr/src/app/dist ./dist

EXPOSE 4000

USER node

CMD [ "node", "dist/main" ]
