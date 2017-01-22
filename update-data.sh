#!/bin/bash
. /home/mattparrilla/.bash_profile

cd /home/mattparrilla/git/mansfield-stake \
&& git pull \
&& source data/venv/bin/activate \
&& /home/mattparrilla/git/mansfield-stake/data/venv/bin/python2.7 data/update_data.py \
&& deactivate \
&& git commit -am "update data by cron" \
&& git checkout gh-pages \
&& git checkout master public/snowdepth.csv > snowdepth.csv \
&& git commit -am "update data by cron" \
&& git push
