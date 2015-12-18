#!/bin/bash

cd /home/mattparrilla/git/mansfield-stake && source venv/bin/activate && /home/mattparrilla/git/mansfield-stake/venv/bin/python2.7 update_data.py && git commit -am "Update data" && git push && deactivate
