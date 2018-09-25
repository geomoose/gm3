#!/usr/bin/env python

from selenium import webdriver
from selenium.webdriver.common.keys import Keys
from selenium.common.exceptions import NoSuchElementException



import tests

driver = webdriver.Firefox()

tests.run(driver)

driver.quit()
