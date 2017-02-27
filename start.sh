#!/bin/bash
BASENAME=gp
NAME=${BASENAME}_gunpowder
MONGO=${BASENAME}_mongo

docker stop $NAME $MONGO &> /dev/null
docker rm $NAME $MONGO &> /dev/null
docker network rm gunpowder
BASEIP='172.2.0.'
docker network create gunpowder --subnet "${BASEIP}0/16"
docker run -d --restart always --name $MONGO \
  --net gunpowder --ip ${BASEIP}2 \
  -v $PWD/work/mongodb:/data/db \
  mongo

if [ "$DEV" == 'true' ]; then
    echo "In dev mode"
    docker build -t gunpowder -f Dockerfile-dev .
else
    docker build -t gunpowder .
fi

docker run -d --restart always --name ${NAME} \
  -p "${MC_PORT:-25565}:25565" \
  -p "${MC_PORT:-25565}:25565/udp" \
  --net gunpowder --ip ${BASEIP}3 \
  -p 80:8080 \
  -v $PWD/work:/work \
  -v $PWD:/app-dev \
  --link ${MONGO}:mongod \
  gunpowder

exit 0