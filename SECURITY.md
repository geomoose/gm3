# GeoMoose Security Policy

## Reporting a Vulnerability in GeoMoose

Security/vulnerability reports should not be submitted through GitHub tickets or the public mailing lists, but instead please send your report 
to the email address: **geomoose-security nospam @ osgeo.org** (remove the blanks and ‘nospam’).  

## Supported Versions

Only the current release of GeoMoose is supported (see https://www.geomoose.org/download.html).

## Version Numbering: Explained

version x.y.z means:

**x**
- Major release series number.
- Major releases indicate substantial changes to the software and 
  backwards compatibility is not guaranteed across series. Current 
  release series is 3.

**y**
- Minor release series number.
- Minor releases indicate smaller, functional additions or improvements 
  to the software and should be generally backwards compatible within a 
  major release series. Users should be able to confidently upgrade 
  from one minor release to another within the same release series, so 
  from 3.13.x to 3.14.x.

**z**
- Point release series number.
- Point releases indicate maintenance releases - usually a combination of 
  bug and security fixes and perhaps small feature additions. Backwards 
  compatibility should be preserved and users should be able to confidently 
  upgrade between point releases within the same release series, 
  so from 3.14.0 to 3.14.15.
