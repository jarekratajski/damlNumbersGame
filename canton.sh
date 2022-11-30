#!/bin/bash

java -jar $HOME/.daml/sdk/2.4.0/canton/canton.jar --bootstrap canton/script.canton --config canton/myconf.conf

#  daml script --ledger-host localhost --ledger-port 5011 --dar .daml/dist/numbers-game-0.1.0.dar --script-name Setup:setup --application-id admin
# daml json-api --ledger-host localhost --ledger-port 5011 --http-port 7575 --allow-insecure-tokens

# postgres
# docker run -d --rm --name canton-postgres --shm-size=256mb --publish 5432:5432 -e POSTGRES_USER=test-user    -e POSTGRES_PASSWORD=test-password postgres:11 postgres -c max_connections=500

# CREATE DATABASE participant1;
# GRANT ALL ON DATABASE participant1 TO CURRENT_USER;
