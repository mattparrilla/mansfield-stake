#Flask Project Template For Webfaction Hosting Environment
This repository is meant to provide a quick way to spin up Flask applications on Webfaction and is based off of [Aaron Presley's](https://twitter.com/AaronPresley) blog post. I'll rely heavily on that post for instructions and will only provide instruction where I deviate from his recipe.

The project structure I've employed here is slighly different, but similar enough that if you get stuck along the way, you should refer to [his original blog post](http://aaronpresley.com/deploying-a-flask-project-on-webfaction/) which is an excellent synthesis of a few snippets floating around out there.

## Steps
1. Create a new application on Webfaction
2. Setup your application as a website
3. Edit `apache2/conf/httpd.conf` (see Step 3 of post)
4. Clone project
    1. `cd ~/webapps/project_name`
    2. `git clone <YOUR PROJECT'S CLONE URL> app`
5. Instantiate virtual environment and install dependencies
    1. `cd ~/webapps/project_name/app/`
    2. `virtualenv venv`
    3. `source venv/bin/activate`
    4. `pip install -r requirements.txt`
6. Create `htdocs/index.py` (slightly modified from Step 6)

        import sys

        # Active your Virtual Environment, which I'm assuming you've already setup
        activate_this='/home/username/webapps/application_name/app/venv/bin/activate_this.py'
        execfile(activate_this, dict(__file__=activate_this))

        # Appending our Flask project files
        sys.path.append('/home/username/webapps/application_name/app')

        # Launching our app
        from main import app as application

7. Point your browser to your new webfaction website!

## `_config.py`
To avoid exposing sensitive config data, I keep a copy of my current config file (with the sensitive data removed) in `_config.py`
