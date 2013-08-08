
var fs = require('fs');
var util = require('util');

var marked = require('marked');
var colors = require('colors');
var highlight = require('highlight.js');

function Parser(options) {
  this.tokens = [];
  this.token = null;
  this.options = options || marked.defaults;
}

util.inherits(Parser, marked.Parser);

Parser.prototype.tok = function () {
  switch (this.token.type) {
    case 'space': {
      return '';
    }

    case 'hr': {
      return new Array(80).join('-') + '\n\n';
    }

    case 'heading': {
      var body = this.token.text;

    	switch (this.token.depth) {
        case 1:
          body = body.toUpperCase();
        default:
          body = body.underline;
      }

      return body + '\n\n';
    }

    case 'code': {
      return highlight.highlight(this.token.lang, this.token.text, function (type, text) {
        switch (type) {
          case 'keyword':
            return text.cyan;
          case 'string':
            return text.red;
          default:
            return text;
        }
      }).value + '\n';

      // if (this.options.highlight) {
      //   var code = this.options.highlight(this.token.text, this.token.lang);
      //   if (code != null && code !== this.token.text) {
      //     this.token.escaped = true;
      //     this.token.text = code;
      //   }
      // }

      // if (!this.token.escaped) {
      //   this.token.text = escape(this.token.text, true);
      // }

      // return '<pre><code'
      //   + (this.token.lang
      //   ? ' class="'
      //   + this.options.langPrefix
      //   + this.token.lang
      //   + '"'
      //   : '')
      //   + '>'
      //   + this.token.text
      //   + '</code></pre>\n';
    }

    case 'table': {
      var body = ''
        , heading
        , i
        , row
        , cell
        , j;

      // header
      body += '<thead>\n<tr>\n';
      for (i = 0; i < this.token.header.length; i++) {
        heading = this.inline.output(this.token.header[i]);
        body += this.token.align[i]
          ? '<th align="' + this.token.align[i] + '">' + heading + '</th>\n'
          : '<th>' + heading + '</th>\n';
      }
      body += '</tr>\n</thead>\n';

      // body
      body += '<tbody>\n'
      for (i = 0; i < this.token.cells.length; i++) {
        row = this.token.cells[i];
        body += '<tr>\n';
        for (j = 0; j < row.length; j++) {
          cell = this.inline.output(row[j]);
          body += this.token.align[j]
            ? '<td align="' + this.token.align[j] + '">' + cell + '</td>\n'
            : '<td>' + cell + '</td>\n';
        }
        body += '</tr>\n';
      }
      body += '</tbody>\n';

      return '<table>\n'
        + body
        + '</table>\n';
    }

    case 'blockquote_start': {
      var body = '';

      while (this.next().type !== 'blockquote_end') {
        body += '|    ' + this.tok();
      }

      return body;
    }

    case 'list_start': {
      var ordered = this.token.ordered;
      var order = 1;
      var body = '';

      while (this.next().type !== 'list_end') {
        body += (ordered ? util.format('%d. ', order++) : '* ') + this.tok();
      }

      return body + '\n';
    }

    case 'list_item_start': {
      var body = '';

      while (this.next().type !== 'list_item_end') {
        body += this.token.type === 'text'
          ? this.parseText()
          : this.tok();
      }

      return body + '\n';
    }

    case 'loose_item_start': {
      var body = '';

      while (this.next().type !== 'list_item_end') {
        body += this.tok();
      }

      return body + '\n';
    }

    case 'html': {
      return !this.token.pre && !this.options.pedantic
        ? this.inline.output(this.token.text)
        : this.token.text;
    }

    case 'paragraph': {
      return this.inline.output(this.token.text) + '\n\n';
    }

    case 'text': {
      return this.parseText() + '\n';
    }
  }
};

var parser = new Parser();

fs.readFile('./README.md', function (err, buffer) {
	var src = marked.lexer(buffer.toString());
  var output = parser.parse(src);

  console.log('>>>>>>>>>>>>>>>>> SOURCE >>>>>>>>>>>>>>>>\n');
	console.log(src);

	console.log('>>>>>>>>>>>>>>>>> MARKDOWN >>>>>>>>>>>>>>>>\n');
	console.log(buffer.toString());

	console.log('>>>>>>>>>>>>>>>>> OUTPUT >>>>>>>>>>>>>>>>\n');
	process.stdout.write(output);
});
