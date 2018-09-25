#
# Basic test to check that the catlog loads in IE
#

def run(driver):
    driver.get('https://demo.geomoose.org/master/desktop/')

    if not 'GeoMoose' in driver.title:
        raise Exception('Unable to load geomoose demo!')

    # ensure the catalog rendered
    elem = driver.find_element_by_id('catalog')
    layers = elem.find_elements_by_class_name('layer')

    if len(layers) != 17:
        raise Exception('Layers did not render!')
