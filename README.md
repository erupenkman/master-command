# master-command
[![NPM version][npm-image]][npm-url] [![Build Status][travis-image]][travis-url]  [![Coverage Status][coveralls-image]][coveralls-url] [![Dependency Status][depstat-image]][depstat-url]

> Control multiple devices from your browser for faster testing

## Usage

First, install `master-command` as a development dependency:

```shell
npm install --save-dev master-command
```

Then, run the command server. using `Gulpfile.js`:

```javascript
gulp.task('command', function() {
  nodemon({
    script: 'node_modules/master-command/command.js'
  })
});

```

include it on your page
```html
  <script src="bower_components/jquery/dist/jquery.js"></script>
  <script src="http://_YOUR_IP_:8001/socket.js-client"></script>
  <script src="http://_YOUR_IP_:8001/master-command"></script>
  <script>
    masterCommand.init('http://_YOUR_IP_:8001');
  </script>


```
## API





## License

[MIT License](http://en.wikipedia.org/wiki/MIT_License)
