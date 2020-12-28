# Setup via docker

Build a docker image using the Dockerfile
```
cd python-bingo-server
docker build -f Dockerfile .
```
That's it. Check for the image id via `docker images`.

# Running

Start the docker container from the created image via

```
docker run -d -p 80:8080 DOCKER_IMAGE_ID
```

`DOCKER_IMAGE_ID` refers to the id from the image created in the setup. Note that `-p 80:8080` maps port 80 of the host OS to port 8080 in the docker container, since the python websocket is listening to port 8080.
