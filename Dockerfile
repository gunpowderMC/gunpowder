FROM ubuntu:16.04

RUN apt-get update && apt-get -y upgrade && apt-get -y dist-upgrade && apt-get -y install curl && \
    curl -sL https://deb.nodesource.com/setup_7.x | bash - && apt-get -y install nodejs && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

RUN apt-get update && apt-get -y upgrade && apt-get -y dist-upgrade && apt-get -y install default-jre && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

RUN apt-get update && apt-get -y upgrade && apt-get -y dist-upgrade && apt-get -y install xz-utils && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

ENV JAVA_HOME=/usr/lib/jvm/java-8-openjdk-amd64/jre

USER 1000
EXPOSE 25565
EXPOSE 25565/udp
EXPOSE 8080
WORKDIR /app/run/work
CMD ["/usr/bin/node", "/app/index.js"]