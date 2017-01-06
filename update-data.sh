#!/bin/bash
. /home/mattparrilla/.bash_profile

cd /home/mattparrilla/git/mansfield-stake \
&& git pull \
&& source data/venv/bin/activate \
&& /home/mattparrilla/git/mansfield-stake/data/venv/bin/python2.7 data/update_data.py \
&& /home/mattparrilla/.nvm/versions/node/v6.9.2/bin/npm run build \
&& deactivate
