#!/bin/bash

cd /home/mattparrilla/git/mansfield-stake && git pull && source venv/bin/activate && /home/mattparrilla/git/mansfield-stake/venv/bin/python2.7 update_data.py && git commit -am "Update data" && git push && deactivate
