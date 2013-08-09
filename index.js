
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
  if (process.argv.length < 3) {
    var pkg = require('./package.json');
    console.log('consoul version: ' + pkg.version);
    console.log('\nusage:');
    console.log('\tconsoul <FILE>\n');
  }
  else {
    var file = process.argv[2];
    process.stdout.write(exports.fromFileSync(file));
  }

}
