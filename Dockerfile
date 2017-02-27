FROM ubuntu:16.04
RUN locale-gen en_US.UTF-8
ENV LANG en_US.UTF-8
ENV LANGUAGE en_US:en
ENV LC_ALL en_US.UTF-8
RUN apt-get update && apt-get -y upgrade && apt-get -y dist-upgrade && apt-get -y install curl && \
    curl -sL https://deb.nodesource.com/setup_7.x | bash - && apt-get -y install nodejs && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

RUN apt-get update && apt-get -y upgrade && apt-get -y dist-upgrade && apt-get -y install default-jre && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

RUN apt-get update && apt-get -y upgrade && apt-get -y dist-upgrade && apt-get -y install xz-utils && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

ENV JAVA_HOME=/usr/lib/jvm/java-8-openjdk-amd64/jre

RUN mkdir -p /app /work
ADD package.json /app/package.json
RUN cd /app && npm install
ADD . /app

EXPOSE 25565
EXPOSE 25565/udp
EXPOSE 8080
WORKDIR /work
CMD ["/usr/bin/node", "/app/index.js"]