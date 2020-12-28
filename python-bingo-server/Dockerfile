FROM debian:stable-slim

WORKDIR /usr/src/app

RUN apt-get update -y
RUN apt-get install -y python3-venv python3-pip

COPY requirements.txt ./

RUN python3 -m venv pyvenv
RUN . ./pyvenv/bin/activate && pip3 install --no-cache-dir -r requirements.txt

COPY server/ server/
COPY runserver.py runserver.py

EXPOSE 8080

CMD . ./pyvenv/bin/activate && python runserver.py