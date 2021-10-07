(function(global) {
"use strict";

const Indiv = function(id) {
  this.id = id;
  this.gene = null;
  this.value = null;
  this.rank = 0;
  this.fit = 0;
  this.origin = null;
  this.evaluated = false;
}
Indiv.prototype.create = function(fn, origin=null) {
  this.gene = fn();
  this.origin = origin;
  return this;
}
Indiv.prototype.eval = function(fn) {
  if (this.evaluated) return this;
  this.value = fn(this.gene);
  this.evaluated = true;
  return this;
}
Indiv.prototype.import = function(a) {
  for (const key of Object.keys(a)) this[key] = a[key];
  return this;
}
Indiv.prototype.export = function() {
  return this;
}
// =============================================================================
const Pool = function() {
  this.current_id = 0;
  this.pool = [];
  this.spawn = () => {
    const indiv = new Indiv(this.current_id++);
    this.pool.push(indiv);
    return indiv;
  }
  this.at = n => this.pool[n];
}
Pool.prototype.import = function(a) {
  this.current_id = a.current_id;
  this.pool = a.pool.map(_ => (new Indiv).import(_));
  return this;
}
Pool.prototype.export = function() {
  return {
    current_id: this.current_id,
    pool: this.pool.map(ind => ind.export())
  }
}
// =============================================================================
const GA = function(ps, gs, compareFn) {
  this.poolSize = ps;
  this.geneSize = gs;

  this.pool = new Pool();
  this.history = [];
  this.group0 = [];
  this.group1 = [];

  this.gen = () => times(this.geneSize, Math.random);
  this.calcRank2d = createCalcRank2d(compareFn, this.poolSize);

  this.init = () => {
    this.group0 = times(this.poolSize, this.pool.spawn);
    this.group0.forEach(ind => ind.create(this.gen));
    this.history.push(this.group0);
    return this;
  }
  this.eval = objFun => {
    this.group0.forEach(ind => ind.eval(objFun));
    const rank = this.calcRank2d(this.group0);
    for (let i = 0; i < this.poolSize; ++i) {
      this.group0[i].rank = rank[i];
      this.group0[i].fit = 0.5 ** (rank[i] - 1);
    }
    return this;
  }
  this.advance = (sfn, cfn) => {
    this.group1 = [];
    const fit = Float64Array.from(this.group0, ind => ind.fit);
    for (let i = 0; i < this.poolSize; ++i) {
      const parents = [];
      for (let j = 0; j < 2; ++j) {
        const index = sfn(fit);
        if (index < 0) {
          console.log("Error: in roulette");
          return;
        }
        parents.push(index);
        fit[index] = 0;
      }
      this.group1.push(
        this.pool.spawn()
                 .create(() => cfn(parents.map(n => this.group0[n].gene)),
                  parents.map(n => this.group0[n].id)));
      parents.forEach(n => fit[n] = this.group0[n].fit);
    }
    [this.group0, this.group1] = [this.group1, this.group0];
    // this.group0 = this.group1;
    this.history.push(this.group0);
    return this;
  }
  this.show = file => {
    const str = this.group0.reduce((a, c) => a + c.value + "\n", "");
    if (file) {
      const FS = require("fs");
      FS.writeFileSync(file, str);
    } else
      p(str);
    return this;
  }
  this.import = (a) => {
    this.poolSize = a.poolSize;
    this.geneSize = a.geneSize;
    this.pool = (new Pool).import(a.pool);
    const toO = id => this.pool.at(id);
    this.history = a.history.map(g => g.map(toO));
    this.group0 = a.group0.map(toO);
    this.group1 = a.group1.map(toO);
    return this;
  }
  this.export = () => {
    const toA = ind => ind.id;
    return data = {
      poolSize: this.poolSize,
      geneSize: this.geneSize,
      pool: this.pool.export(),
      history: this.history.map(g => g.map(toA)),
      group0: this.group0.map(toA),
      group1: this.group1.map(toA)
    }
  }
  this.save = (key, flag) => {
    const data = JSON.stringify(this.export());
    if (!key) return data;
    if (flag) flag.old = !!localStorage[key];
    return localStorage[key] = data
  }
  this.load = (key) => {
    const data = localStorage[key];
    if (data) this.import(JSON.parse(data));
    return data || "";
  }
}

// #############################################################################

const createCalcRank2d = (fn, _size=100) => {
  let size = _size
  let is_dominated = new Uint32Array(size * size); // [0, 1]
  let num_dominated = new Uint32Array(size);
  let mask = new Uint32Array(size);                // [0, 1]
  let rank = new Uint32Array(size);
  return group => {
    const length = group.length;
    if (length > size) {
      size = length;
      is_dominated = new Uint32Array(size * size);
      num_dominated = new Uint32Array(size);
      mask = new Uint32Array(size);
      rank = new Uint32Array(size);
    }
    rank.fill(0);
    for (let i = 0; i < length; ++i) {
      let s = 0;
      for (let j = 0; j < length; ++j) {
        // iはjに優越されているか
        const v = i !== j && fn(group[i], group[j]);
        is_dominated[i * length + j] = v;//i !== j && fn(group[i], group[j]);
        s += v;
      }
      // iを優越している個体を数える
      num_dominated[i] = s;//um(is_dominated, i * length, (i + 1) * length);
    }

    for (let r = 0; r < length; ++r) {
      for (let i = 0; i < length; ++i) {
        // iがランク未決定かつ最前線
        mask[i] = !(rank[i] || num_dominated[i]);
        if (mask[i]) rank[i] = r + 1;
      }
      for (let i = 0; i < length; ++i) {
        if (!rank[i]) break;
        if (i == length - 1) return rank;
      }
      for (let i = 0; i < length; ++i)
        for (let j = 0; j < length; ++j)
          num_dominated[i] -= mask[j] && is_dominated[i * length + j];
    }
    console.error("Error: in createCalcRank2d");
    return null;
  }
}

const roulette = fit => {
  let wheel = rsum(fit) * Math.random();
  for (let i = 0, l = fit.length; i < l; ++i) {
    if (fit[i] <= 0) continue;
    if ((wheel -= fit[i]) < 0) return i;
  }
  return -1;
}

const createBLX = alpha => (a0, a1) => {
  const dst = [];
  for (let i = 0, l = a0.length; i < l; ++i) {
    const range = (0.5 + alpha) * (a0[i] - a1[i]);
    const mean = 0.5 * (a0[i] + a1[i]);
    dst.push(clamp(mean + range * Math.random(), 0, 1));
  }
  return dst;
}

const createPMU = eta => a => {
  const dst = [];
  for (let i = 0, l = a.length; i < l; ++i) {
    const r = Math.random();
    dst.push(clamp(a[i] + (r <= 0.5 ?
      ((2 * r) **       (1 / (1 + eta)) - 1) * a[i] :
      ((2 * (1 - r)) ** (1 / (1 + eta)) - 1) * (a[i] - 1)), 0, 1));
  }
  return dst;
}

const createCalcHV = (ref, idx=[0, 1]) => {
  const fn = (a, b) => {
    for (let i = 0, l = idx.length; i < l; ++i) {
      const v = a.value[idx[i]] - b.value[idx[i]];
      if (v) return -v;
    }
    return 0;
  }
  return group => {
    const arc = group.filter(ind => ind.rank === 1 &&
                                    ind.value[idx[0]] <= ref[0] &&
                                    ind.value[idx[1]] <= ref[1])
                     .sort(fn);
    let res = (ref[0] - arc[0].value[idx[0]])
              * Math.max(0, ref[1] - arc[0].value[idx[1]]);
    for (let i = 1, l = arc.length; i < l; ++i) {
      res += (arc[i - 1].value[idx[0]] - arc[i].value[idx[0]])
             * Math.max(0, ref[1] - arc[i].value[idx[1]]);
    }
    return res;
  }
}

// #############################################################################

const funcZDT1 = a => {
  const g = 1 + 9 * sum(a, 1) / (a.length - 1);
  return [a[0], g * (1 - Math.sqrt(a[0] / g))];
}

const funcZDT2 = a => {
  const g = 1 + 9 * sum(a, 1) / (a.length - 1);
  return [a[0], g * (1 - (a[0] / g) ** 2)];
}

const funcZDT3 = a => {
  const g = 1 + 9 * sum(a, 1) / (a.length - 1);
  const v = a[0] / g;
  return [a[0], g * (1 - Math.sqrt(v) - v * Math.sin(10 * Math.PI * a[0]))];
}

// #############################################################################

const test = () => {
  const poolSize = 100;
  const geneSize = 5;
  const blx = createBLX(0.5);
  const pmu = createPMU(20);
  const mating = a => {
    const b = blx(a[0], a[1]);
    return Math.random() < 0.01 ? pmu(b) : b;
  };

  ga = new GA(poolSize, geneSize);
  ga.init();
  ga.eval(funcZDT1);
  // console.log(ga.group0);
  // console.log(ga.group0);
  times(100, () => {
    ga.advance(roulette, mating);
    ga.eval(funcZDT1);
  });

  // ga.show();
  return JSON.stringify(ga.group0);

  // ga.show("test.csv");

  // console.log(ga.group0);
}

const creteGAHandle = poolSize => {
  // const poolSize = 100;
  const geneSize = 5;
  // const compareFn = (ind0, ind1) => {
  //   for (let i = 0, l = ind0.value.length; i < l; ++i)
  //     if (ind0.value[i] <= ind1.value[i]) return false;
  //   return true;
  // }
  const compareFn = (ind0, ind1) => {
    for (let i = 0, l = ind0.value.length; i < l; ++i)
      if (ind0.value[i] < ind1.value[i]) return false;
    for (let i = 0, l = ind0.value.length; i < l; ++i)
      if (ind0.value[i] != ind1.value[i]) return true;
    return false;
  }

  const blx = createBLX(0.5);
  const pmu = createPMU(20);
  const mating = a => {
    const b = blx(a[0], a[1]);
    return Math.random() < 0.01 ? pmu(b) : b;
  };

  let generation = 0;

  // const ga = new GA(poolSize, geneSize, compareFn);

  return {
    _ready: false,
    _ga: new GA(poolSize, geneSize, compareFn),
    get group0() { return this._ga.group0; },
    get group1() { return this._ga.group1; },
    get current_id() { return this._ga.pool.current_id; },
    get generation() { return generation; },
    call: function() {
      if (!this._ready) {
        this._ga.init();
        this._ready = true;
      } else {
        this._ga.advance(roulette, mating);
        ++generation;
      }
      this._ga.eval(funcZDT1);
      return this;
    },
    reset: function() {
      this._ga = new GA(poolSize, geneSize, compareFn);
      this._ready = false;
      generation = 0;
      return this;
    }
  }
}

// #############################################################################
global.GABase = {
  roulette: roulette,
  createBLX: createBLX,
  createPMU: createPMU,
  createCalcRank2d: createCalcRank2d,
  createCalcHV: createCalcHV,
  func: { ZDT1: funcZDT1,
          ZDT2: funcZDT2,
          ZDT3: funcZDT3 }
};
global.GA0 = {
  creteGAHandle: creteGAHandle
};

})(this);
