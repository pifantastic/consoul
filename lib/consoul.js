
var fs = require('fs');
var util = require('util');

var marked = require('marked');
var colors = require('colors');
var highlight = require('../hacks/highlight.js');

function Parser (options) {
  marked.Parser.call(this, options);
}

function InlineLexer (links, options) {
  marked.InlineLexer.call(this, links, options);
}

util.inherits(Parser, marked.Parser);
util.inherits(InlineLexer, marked.InlineLexer);

Parser.prototype.parse = function (src) {
  this.inline = new InlineLexer(src.links, this.options);
  this.tokens = src.reverse();

  var out = '';
  while (this.next()) {
    out += this.tok();
  }

  return out;
};

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
          break;
        default:
          body = body.underline;
      }

      return body + '\n\n';
    }

    case 'code': {
      if (!this.token.lang) {
        return 'CODE:'.inverse + '\n' + this.token.text + '\n';
      }

      var body = (this.token.lang + ':').inverse + '\n';
      return body + highlight.highlight(this.token.lang, this.token.text, function (type, text) {
        switch (type) {
          case 'keyword':
            return text.cyan;
          case 'string':
            return text.red;
          case 'params':
            return text[0] + text.substring(1, text.length - 1).green + text[text.length - 1];
          case 'literal':
            return text.yellow;
          default:
            return text;
        }
      }).value + '\n';
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

InlineLexer.prototype.output = function(src) {
  var out = ''
    , link
    , text
    , href
    , cap;

  while (src) {
    // escape
    if (cap = this.rules.escape.exec(src)) {
      src = src.substring(cap[0].length);
      out += cap[1];
      continue;
    }

    // autolink
    if (cap = this.rules.autolink.exec(src)) {
      src = src.substring(cap[0].length);
      if (cap[2] === '@') {
        text = cap[1][6] === ':'
          ? this.mangle(cap[1].substring(7))
          : this.mangle(cap[1]);
        href = this.mangle('mailto:') + text;
      } else {
        text = cap[1];
        href = text;
      }
      out += text.underline;
      continue;
    }

    // url (gfm)
    if (cap = this.rules.url.exec(src)) {
      src = src.substring(cap[0].length);
      text = cap[1];
      href = text;
      out += text.underline.inverse;
      continue;
    }

    // tag
    if (cap = this.rules.tag.exec(src)) {
      src = src.substring(cap[0].length);
      out += cap[0];
      continue;
    }

    // link
    if (cap = this.rules.link.exec(src)) {
      src = src.substring(cap[0].length);
      out += this.outputLink(cap, {
        href: cap[2],
        title: cap[3]
      });
      continue;
    }

    // reflink, nolink
    if ((cap = this.rules.reflink.exec(src))
        || (cap = this.rules.nolink.exec(src))) {
      src = src.substring(cap[0].length);
      link = (cap[2] || cap[1]).replace(/\s+/g, ' ');
      link = this.links[link.toLowerCase()];
      if (!link || !link.href) {
        out += cap[0][0];
        src = cap[0].substring(1) + src;
        continue;
      }
      out += this.outputLink(cap, link);
      continue;
    }

    // strong
    if (cap = this.rules.strong.exec(src)) {
      src = src.substring(cap[0].length);
      out += this.output(cap[2] || cap[1]).bold;
      continue;
    }

    // em
    if (cap = this.rules.em.exec(src)) {
      src = src.substring(cap[0].length);
      out += this.output(cap[2] || cap[1]).italic;
      continue;
    }

    // code
    if (cap = this.rules.code.exec(src)) {
      src = src.substring(cap[0].length);
      out += '`' + cap[2] + '`';
      continue;
    }

    // br
    if (cap = this.rules.br.exec(src)) {
      src = src.substring(cap[0].length);
      out += '\n\n';
      continue;
    }

    // del (gfm)
    if (cap = this.rules.del.exec(src)) {
      src = src.substring(cap[0].length);
      out += '~' + this.output(cap[1]) + '~';
      continue;
    }

    // text
    if (cap = this.rules.text.exec(src)) {
      src = src.substring(cap[0].length);
      out += this.smartypants(cap[0]);
      continue;
    }

    if (src) {
      throw new
        Error('Infinite loop on byte: ' + src.charCodeAt(0));
    }
  }

  return out;
};

exports.Parser = Parser;
