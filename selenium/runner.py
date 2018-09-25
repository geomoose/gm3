#!/usr/bin/env python

import os

# ensure the .env file is honoured.
from dotenv import load_dotenv

# this is a bit verbose but gets around an issue with
#  python-dotenv 1.0
BASE_DIR = os.path.abspath(os.path.dirname(__file__))
load_dotenv(dotenv_path=os.path.join(BASE_DIR, '.env'))

from selenium import webdriver
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.common.desired_capabilities import DesiredCapabilities

import tests

desired_cap = {
 'browser': 'IE',
 'browser_version': '11.0',
 'os': 'Windows',
 'os_version': '10',
 'resolution': '1280x1024',
 'project': 'geomoose',
}

driver = webdriver.Remote(
    command_executor='http://%(username)s:%(key)s@hub.browserstack.com:80/wd/hub' % {
        'username': os.getenv('BSTACK_USERNAME'),
        'key': os.getenv('BSTACK_KEY'),
    },
    desired_capabilities=desired_cap)

try:
    tests.run(driver)
finally:
    driver.quit()
