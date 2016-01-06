# nuage [![Build Status](https://secure.travis-ci.org/theredcat/nuage.png?branch=master)](http://travis-ci.org/theredcat/nuage)

A Cloud-ready website builder

## Getting Started
Install the module with: `npm install nuage`

```javascript
var nuage = require('nuage');
nuage.start();
```

## Documentation
_(Coming soon)_

## Examples
_(Coming soon)_

## Contributing
### Code validation
Every contribution is welcome! The Main goals and direction of this project are written below.

The code is validated via grunt wich use :
 - JSHint : for code quality
 - JSCS : for code standards
 - JSONLint : for JSON Validation
 - VNU.jar : For html validation

Simply use `grunt test` to build and run tests. You will need a Java Runtime Environement (JRE) installed to do HTML tests.

Your PR won't be merged to master unless there is absolutly no error thrown by Grunt on it.

### Goals
This is a simple todolist and goal for this project.
 - Templating
   - Generic template-maker : can use a lot of different css/display framework. Basics only : Buttons, Boxes, Popup, Grid and Forms
   - Specific template-maker : can switch to Bootstrap-specific output (for example). Disable outputs frameworks wich don't have bootstrap-equivalent widgets (e.g. : console output), but you gain the possibility to use bootstrap-specific widget
 - Objects metrics, Graph with
   - Total memory available
   - Total memory usage
   - % per server memory usage (Cache)
   - % per object memory usage (Cache)
   - % per object per server memory usage (Cache)
   - Database disk usage
   - Database entries number per object
   - Database entries number per object
 - Poor men alarms
   - Email or HTTP request
   - Based on above metrics
 - Data
   - Object maker : Interface to desing objects and relations
     - Field name autocomplete
     - Fields with same name and constraints are equals and can be used for joins
   - Generic types to ship with the project (Articles, Image, Menu, Header, Foorter, Products, Customer, etc...)
   - Object definitions must be updatable
     - Batch update existing persistant objects
     - Clean objects cache if needed
     - Wait for messages objects to be consumed
     - Allow property to be used in templates/workflow
   - Object storage options :
     - Realtime JSON : Real-time messages, only id-selectable, not written to disk => RethinkDB? Redis? RabbitMQ?
     - Soft JSON : Ack on mem write, written to disk in background => RethinkDB
     - Hard JSON : Ack on disk write => RethinkDB
     - Hard Cached JSON : Soft JSON but only id-selectable but superfast GET => Redis
     - Soft Cached JSON : Soft JSON but only id-selectable but superfast GET => Redis
     - Files : Ack on disk write => Ceph? Nuage-made?
 - Easy contribution
   - Possibility to publish a generic type/template on Nuage github repository via in-app oAuth to Github + auto PR
   - Can use a private repo instead of nuage main. Nuage main will still be available if you want to contribute for a specific creation

## Release History
 - 0.1.x : First release, private
 - 0.2.0 : First public release, limited doc, limited functions
 - 0.3.0 : Complete rewrite with data-centic developement in mind in JS 1.7/ES6

## License
Copyright (c) 2016 Nathan DELHAYE  
Licensed under the GPLv2 license.
