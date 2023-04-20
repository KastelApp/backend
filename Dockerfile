 #   ██╗  ██╗ █████╗ ███████╗████████╗███████╗██╗
 #   ██║ ██╔╝██╔══██╗██╔════╝╚══██╔══╝██╔════╝██║
 #  █████╔╝ ███████║███████╗   ██║   █████╗  ██║
 #  ██╔═██╗ ██╔══██║╚════██║   ██║   ██╔══╝  ██║
 # ██║  ██╗██║  ██║███████║   ██║   ███████╗███████╗
 # ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝   ╚═╝   ╚══════╝╚══════╝
 # Copyright(c) 2022-2023 DarkerInk
 # GPL 3.0 Licensed

FROM debian:buster

RUN apt update && apt -y upgrade

RUN apt install -y lsb-release wget curl gnupg software-properties-common git

RUN curl -sL https://deb.nodesource.com/setup_18.x | bash - \
    && apt -y install nodejs


RUN curl -fsSL https://packages.redis.io/gpg |  gpg --dearmor -o /usr/share/keyrings/redis-archive-keyring.gpg && \
    echo "deb [signed-by=/usr/share/keyrings/redis-archive-keyring.gpg] https://packages.redis.io/deb $(lsb_release -cs) main" |  tee /etc/apt/sources.list.d/redis.list && \
    apt update && \
    apt install -y redis

RUN wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc |  apt-key add - && \
    echo "deb http://repo.mongodb.org/apt/debian buster/mongodb-org/6.0 main" |  tee /etc/apt/sources.list.d/mongodb-org-6.0.list && \
    apt update && \
    apt install -y mongodb-org


WORKDIR /Kastel

COPY . ./

RUN mkdir -p /Kastel/logs && \
    mkdir -p /Kastel/db && \
    mkdir -p /Kastel/db/mongo && \
    mkdir -p /Kastel/db/redis

RUN if [ ! -f /Kastel/src/config.js ]; then cp -p /Kastel/src/config.example.js /Kastel/src/config.js; fi

RUN npm install

EXPOSE 62250

CMD [ "npm", "run", "db" ]