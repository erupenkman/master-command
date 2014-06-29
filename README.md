(PLUGIN AUTHOR: Please read [Plugin README conventions](https://github.com/wearefractal/gulp/wiki/Plugin-README-Conventions), then delete this line)

# gulp-master-command
[![NPM version][npm-image]][npm-url] [![Build Status][travis-image]][travis-url]  [![Coverage Status][coveralls-image]][coveralls-url] [![Dependency Status][depstat-image]][depstat-url]

> master-command plugin for [gulp](https://github.com/wearefractal/gulp)

## Usage

First, install `gulp-master-command` as a development dependency:

```shell
npm install --save-dev gulp-master-command
```

Then, add it to your `gulpfile.js`:

```javascript
var master-command = require("gulp-master-command");

gulp.src("./src/*.ext")
	.pipe(master-command({
		msg: "Hello Gulp!"
	}))
	.pipe(gulp.dest("./dist"));
```

## API

### master-command(options)

#### options.msg
Type: `String`  
Default: `Hello World`

The message you wish to attach to file.


## License

[MIT License](http://en.wikipedia.org/wiki/MIT_License)

[npm-url]: https://npmjs.org/package/gulp-master-command
[npm-image]: https://badge.fury.io/js/gulp-master-command.png

[travis-url]: http://travis-ci.org/erupenkman/gulp-master-command
[travis-image]: https://secure.travis-ci.org/erupenkman/gulp-master-command.png?branch=master

[coveralls-url]: https://coveralls.io/r/erupenkman/gulp-master-command
[coveralls-image]: https://coveralls.io/repos/erupenkman/gulp-master-command/badge.png

[depstat-url]: https://david-dm.org/erupenkman/gulp-master-command
[depstat-image]: https://david-dm.org/erupenkman/gulp-master-command.png
