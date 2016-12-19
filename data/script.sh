#!/bin/bash

cd /home/mattparrilla/git/mansfield-stake/data && git pull && source venv/bin/activate && /home/mattparrilla/git/mansfield-stake/data/venv/bin/python2.7 update_data.py && git commit -am "Update data" && git push && deactivate
