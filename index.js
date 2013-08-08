
var fs = require('fs');
var marked = require('marked');
var Parser = require('./lib/consoul').Parser;

exports.fromFile = function (path, cb) {
  var parser = new Parser();
  fs.readFile(path, function (err, buffer) {
    var src = marked.lexer(buffer.toString());
    return parser.parse(src);
  });
};

exports.fromFileSync = function (path) {
  var parser = new Parser();
  var buffer = fs.readFileSync(path);
  var src = marked.lexer(buffer.toString());
  return parser.parse(src);
};

exports.fromString = function (string) {
  var parser = new Parser();
  var src = marked.lexer(string);
  return parser.parse(src);
};

if (require.main === module) {
  process.stdout.write(exports.fromFileSync('./EXAMPLE.md'));
}
