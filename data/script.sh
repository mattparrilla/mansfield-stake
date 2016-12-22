#!/bin/bash

cd /home/mattparrilla/git/mansfield-stake \
&& git pull \
&& source data/venv/bin/activate \
&& /home/mattparrilla/git/mansfield-stake/data/venv/bin/python2.7 data/update_data.py \
&& npm run build \
&& deactivate
