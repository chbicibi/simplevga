(function(global) {
"use strict";

const PI4 = 4 * Math.PI;

const inherits = (Sub, Super) => {
  Sub.prototype = Object.create(Super.prototype);
  Sub.prototype.constructor = Sub;
}

Object.prototype.tap = function(fn) {
  if (fn) fn(this);
  return this;
}

const p = x => {
  console.log(x);
  return x;
}

global.PI4 = PI4;
global.inherits = inherits;
global.tap = tap;
global.p = p;

})(this);

const sum = (a, b=0, e=a.length) => {
  let s = 0;
  for (let i = b; i < e; ++i) {
    s += a[i];
  }
  return s;
}

const rsum = (a, b=0, e=a.length) => {
  let s = 0;
  for (let i = b; i < e; ++i) {
    s += Math.max(0, a[i]);
  }
  return s;
}

const clamp = (v, lo, hi) => Math.min(Math.max(lo, v), hi);

const times = (n, fn) => {
  let res = [];
  for (let i = 0; i < n; ++i) {
    res.push(fn());
  }
  return res;
}
