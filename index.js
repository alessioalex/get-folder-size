"use strict";

var fs = require('fs');
var path = require('path');
var async = require('async');

function readSizeRecursive(item, ignoreRegExp, cb) {
  if (!cb) {
    cb = ignoreRegExp;
    ignoreRegExp = null;
  }

  fs.lstat(item, function(err, stats) {
    var total = !err ? (stats.size || 0) : 0;

    if (!err && stats.isDirectory()) {
      fs.readdir(item, function(err, list) {
        if (err) { return cb(err); }

        async.forEach(
          list,
          function(dirItem, callback) {
            readSizeRecursive(path.join(item, dirItem), ignoreRegExp, function(err, size) {
              if (!err) { total += size; }

              callback(err);
            });
          },
          function(err) {
            cb(err, total);
          }
        );
      });
    } else {
      if (ignoreRegExp && ignoreRegExp.test(item)) {
        total = 0;
      }

      cb(err, total);
    }
  });
}

module.exports = readSizeRecursive;
