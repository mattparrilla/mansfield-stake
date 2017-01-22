#!/bin/bash
. /home/mattparrilla/.bash_profile

cd /home/mattparrilla/git/mansfield-stake \
&& git checkout gh-pages
&& git pull \
&& source data/venv/bin/activate \
&& /home/mattparrilla/git/mansfield-stake/data/venv/bin/python2.7 data/update_data.py \
&& git commit -am "cron update of data"
&& git push
&& deactivate
