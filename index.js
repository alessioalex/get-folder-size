'use strict';

const fs = require('fs');
const path = require('path');
const eachAsync = require('tiny-each-async');

function readSizeRecursive(item, ignoreRegEx, callback) {
  let cb;
  let ignoreRegExp;

  if (!callback) {
    cb = ignoreRegEx;
    ignoreRegExp = null;
  } else {
    cb = callback;
    ignoreRegExp = ignoreRegEx;
  }

  fs.lstat(item, function lstat(e, stats) {
    let total = !e ? (stats.size || 0) : 0;

    if (!e && stats.isDirectory()) {
      fs.readdir(item, (err, list) => {
        if (err) { return cb(err); }

        eachAsync(
          list,
          (dirItem, next) => {
            readSizeRecursive(
              path.join(item, dirItem),
              ignoreRegExp,
              (error, size) => {
                if (!error) { total += size; }

                next(error);
              }
            );
          },
          (finalErr) => {
            cb(finalErr, total);
          }
        );
      });
    } else {
      if (ignoreRegExp && ignoreRegExp.test(item)) {
        total = 0;
      }

      cb(e, total);
    }
  });
}

module.exports = readSizeRecursive;
