# Consoul

Consoul is a markdown renderer for the terminal. You might say it adds some soul to your console? I'm so sorry.

## Usage

```javascript
var consoul = require('consoul');

process.stdout.write(consoul.fromFileSync('./README'));

consoul.fromFile(function (err, output) {
	process.stdout.write(output);
});

process.stdout.write(consoul.fromString('# Hello World!'));
```

## Why?

We wanted to write markdown documentation for our grunt tasks. We wanted to be able to display that documentation when running `grunt help`. Whatevs.

## How?

Consoul uses the [marked](https://github.com/chjj/marked) Markdown parser. It overrides a few methods to render console appropriate stuff instead of HTML. It uses a (hacked!) version of [highlight.js](https://github.com/isagalaev/highlight.js) to do the syntax highlighting.

## TODO

* Formatting of GFM tables
