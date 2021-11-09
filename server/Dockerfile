FROM node:17.0

WORKDIR /app
ADD package.json yarn.lock tsconfig.json /app/
RUN yarn install

ADD src/ /app/src/
RUN yarn tsc
CMD [ "/app/src/foo.js" ] 