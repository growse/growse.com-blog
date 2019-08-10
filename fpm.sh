#! /bin/bash
JFPM=https://github.com/rholder/jfpm/releases/download/v1.3.3.1/jfpm
curl -C - -o jfpm -L ${JFPM}
chmod +x jfpm
./jfpm "$@"