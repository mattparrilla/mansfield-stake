#!/bin/bash

cd /home/mattparrilla/git/mansfield-stake && git pull && cd data && source venv/bin/activate && /home/mattparrilla/git/mansfield-stake/data/venv/bin/python2.7 update_data.py && git commit -am "Update data" && git push && deactivate
