tiobot is a web interface to a workflow automation based on vulnerability data downloaded from Tenable.io.
It requires a Mongo DB to access the data from Tenable.io.  The database is populated by the tiovulndlr microservice.
See tiovulndlr for how to setup the Mongo DB.

# To Build
To build tiobot: docker build ./ -t tiobot

# To Run
To run tiobot: 

**docker run -p 443:443 -v /Users/jjsmith/tiobot-config.js:/usr/src/app/configuration/config.js:ro  --name=tiobot --link tiovulndb:mongo -it tiobot**


