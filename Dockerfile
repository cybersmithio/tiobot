FROM node

MAINTAINER jamessmith@tenable.com

COPY html /usr/src/app

RUN cd /usr/src/app; npm install

EXPOSE 443

WORKDIR /usr/src/app

CMD node tiobot.js
