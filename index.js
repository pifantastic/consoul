
var fs = require('fs');
var fmt = require('util').format;

var marked = require('marked');
var colors = require('colors');

var Consoul = function (file) {
	this.inBlockquote = false;
	this.inList = false;
	this.inListItem = false;
	this.order = null;
};

Consoul.NEWLINE = process.platform === 'windows' ? '\r\n' : '\n';

Consoul.prototype.parse = function (src) {
  // this.inline = new InlineLexer(src.links, this.options);
  this.tokens = src.reverse();

  var out = '';
  while (this.next()) {
    out += this.tok();
  }

  return out;
};

Consoul.prototype.next = function() {
  this.token = this.tokens.pop();
  return this.token;
};

Consoul.prototype.peek = function() {
  return this.tokens[this.tokens.length-1] || 0;
};

Consoul.prototype.parseText = function() {
  var body = this.token.text;

  while (this.peek().type === 'text') {
    body += '\n' + this.next().text;
  }

  return body;
};

Consoul.prototype.tok = function() {
	var body = '';

	switch (this.token.type) {
		case 'space':
			return '';

		case 'hr':
			return new Array(80).join('-') + '\n\n';

		case 'heading':
			body = this.token.text;

			switch (this.token.depth) {
				case 1:
					body = body.toUpperCase();
				default:
					body = body.underline;
			}
			return body + '\n\n';

		case 'code':
			return this.token.text + '\n';

		case 'table':
			var heading, i, row, cell, j;

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
			body += '<tbody>\n';
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

			return '<table>\n' + body + '</table>\n';

		case 'blockquote_start':
			while (this.next().type !== 'blockquote_end') {
				body += '|    ' + this.tok();
			}

			return body + '\n';

		case 'list_start':
			var ordered = this.token.ordered;
			var order = 1;
			var prefix = '';

			while (this.next().type !== 'list_end') {
				prefix = ordered ? fmt('%d. ', order++) : '* ';
				body += prefix + this.tok();
			}

			return body + '\n';

		case 'list_item_start':
			while (this.next().type !== 'list_item_end') {
				body += this.token.type === 'text'
					? this.parseText()
					: this.tok();
			}

			return body + '\n';

		case 'loose_item_start':
			while (this.next().type !== 'list_item_end') {
				body += this.tok();
			}

			return body + '\n';

		case 'html':
			return !this.token.pre && !this.options.pedantic
				? this.inline.output(this.token.text)
				: this.token.text;

		case 'paragraph':
			return this.token.text + '\n\n';

		case 'text':
			return this.parseText() + '\n';

	}
};

var consoul = new Consoul();

fs.readFile('./README.md', function (err, buffer) {
	var src = marked.lexer(buffer.toString());
	console.log(src);
	console.log('>>>>>>>>>>>>>>>>> MARKDOWN >>>>>>>>>>>>>>>>\n');
	console.log(buffer.toString());
	var output = consoul.parse(src);
	console.log('>>>>>>>>>>>>>>>>> OUTPUT >>>>>>>>>>>>>>>>\n');
	process.stdout.write(output);
});
