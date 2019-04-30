# Getting Started with GeoMoose 3 on Windows


## 1. Install Node with npm

Travel to the official [NodeJS site](https://nodejs.org/en/) and download the latest LTS release of NodeJS.

It is fine to install Node with all of the defaults.  That will put the node command line in the PATH and install the NPM package manager.

After node is installed, open a Command Prompt and install Grunt.

```
npm install -g grunt
```


## 2. Create a Folder for GeoMoose

These examples will use C:\GeoMoose as the target folder.

## 3. Install Git

I would suggest [GitHub Desktop](https://desktop.github.com/).  It's a nice clean interface.  Any Git client will work fine. 

## 4. Clone the GeoMoose3 Repository

Upon installation GitHub Desktop the GUI will ask prompt the user if they wish to Add, Create, or Clone a repository. The GeoMoose/gm3 repository will not be immediately available unless you are a member of the geomoose GitHub organization.  

If it is not available then double click on 'Git shell' and execute the following:

```
cd c:\GeoMoose
git clone https://github.com/geomoose/gm3.git
```

## 5. Install Packages

The best way to do this is using the command line.  Upon up a shell (command, PowerShell, Git Shell) and run the following:

```
cd c:\GeoMoose\gm3
npm install
```

## 6. Do an initial build and startup the application

From the command prompt:

```
cd c:\GeoMoose\gm3
grunt build
grunt serve
```
