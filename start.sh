#!/bin/bash
npm install
docker-compose down
docker-compose up -d --build
chown :users run -R
chmod 775 run -R
chmod 600 run/authorized_keys
chown 1000:1000 run/authorized_keys
