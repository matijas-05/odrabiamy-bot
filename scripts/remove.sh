#!/bin/bash

RED='\033[0;31m'
NC='\033[0m' # No Color
VERSION=$(jq -r '.version' package.json)

docker container rm -f odrabiamy-bot
docker image rm -f matijas05/odrabiamy-bot:$VERSION
docker image rm -f matijas05/odrabiamy-bot:dev
