'use strict';

const fs = require('fs');

const _ = require('lodash');
const clone = require('clone');
const yaml = require('yamljs');

const expand = require('./expand');
const schema = require('../util/schema');

const descriptor = exports;

class Descriptor {
  constructor (schemaName, path, contents) {
    if (typeof schemaName !== 'string' || typeof path !== 'string' ||
        typeof contents !== 'object') {
      throw new TypeError('Path must be a string, contents must be an object');
    }

    this.schemaName = schemaName;
    this.path = path;
    this.contents = contents;
  }

  get (key) {
    return _.get(this.contents, key, undefined);
  }

  /**
   * Supports either set(key, value) where key is a path or a map like:
   *
   *  {
   *    key: value,
   *    key: value
   *  }
   */
  set (key, value) {
    return new Promise((resolve, reject) => {
      var data = {};
      if (typeof key === 'string') {
        data[key] = value;
      } else {
        data = key;
      }

      // We don't want to modift `this.contents` until we've verified whether or
      // not the contents meet our schema.
      var contents = clone(this.contents);
      _.each(data, (v,k) => {
        _.set(contents, k, v);
      });

      this.validate(contents).then((contents) => {
        this.contents = contents;
        resolve(clone(this.contents));
      }).catch(reject);
    });
  }

  validate (contents) {
    contents = contents || this.contents;
    return Descriptor.validate(this.schemaName, contents);
  }

  get yaml () {
    // Inline after a depth of 5 and use two sapces for indentation.
    return yaml.stringify(this.contents, 5, 2);
  }

  write () {
    return new Promise((resolve, reject) => {
      var filePath = this.path;
      var contents = this.yaml;

      fs.writeFile(filePath, contents, function (err) {
        if (err) {
          return reject(err);
        }

        resolve();
      });
    });
  }

  static create (Klass, schemaName, filePath, data) {
    var obj = new Klass(schemaName, filePath, data);
    return obj.write();
  }

  static validate (schemaName, data) {
    return schema.validate(schemaName, data);
  }

  static read (Klass, schemaName, filePath) {
    return expand(filePath).then((contents) => {
      return schema.validate(schemaName, contents).then((contents) => {
        return Promise.resolve(new Klass(schemaName, filePath, contents));
      });
    }).catch((errors) => {
      return Promise.reject((Array.isArray(errors)) ? errors : [ errors ]);
    });
  }
}

descriptor.Descriptor = Descriptor;