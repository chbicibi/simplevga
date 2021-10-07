(function(global) {
"use strict";

const Indiv = function(id) {
  this.id = id
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
const Pool = function(ctor) {
  this.current_id = 0;
  this.data = [];
  this.spawn = () => {
    const inst = new ctor(this.current_id++);
    this.data.push(inst);
    return inst;
  }
  this.at = n => this.data[n];
}
Pool.prototype.import = function(a) {
  this.current_id = a.current_id;
  this.data = a.data.map(_ => (new Indiv).import(_));
  return this;
}
Pool.prototype.export = function() {
  return {
    current_id: this.current_id,
    data: this.data.map(ind => ind.export())
  }
}
// =============================================================================
const IndivNode = function() {
  this.rank = null;
  this.fit = null;
  this.parents = [];
  this.indiv = null;
}
// =============================================================================
const GA = function(geneSize, compareFn) {
  // this.poolSize = ps;
  this.geneSize = geneSize;

  this.pool = new Pool(Indiv);
  this.history = [];
  this.currentGroup = [].tap(g => g.idx = -1);
  this.targetGroup = [].tap(g => g.idx = 0);

  this.calcRank2d = GABase.createCalcRank2d(compareFn);

  this.init = () => {
    this.targetGroup = [];
    // this.targetGroup.forEach(ind => ind.create(this.gen));
    this.history.push(this.targetGroup);
    return this;
  }
  this.eval = objFun => {
    this.targetGroup.forEach(ind => ind.eval(objFun));
    const rank = this.calcRank2d(this.targetGroup);
    this.targetGroup.forEach((ind, i) => {
      ind.rank = rank[i];
      ind.fit = 0.5 ** (rank[i] - 1);
    });
    return this;
  }
  this.swapGroup = () => {
    const nextGroup = [].tap(g => g.idx = this.targetGroup.idx + 1);
    [this.currentGroup, this.targetGroup] = [this.targetGroup, nextGroup];
    this.history.push(this.currentGroup);
    return this;
  }
  this.advance = (sfn, cfn) => {
    this.targetGroup = [];
    const fit = Float64Array.from(this.currentGroup, ind => ind.fit);
    for (let i = 0, l = this.targetGroup.length; i < l; ++i) {
      const parents = [];
      for (let j = 0; j < 2; ++j) {
        const index = sfn(fit);
        if (index < 0) {
          console.log("Error: in GABase.roulette");
          return;
        }
        parents.push(index);
        fit[index] = 0;
      }
      this.targetGroup.push(
        this.pool.spawn()
                 .create(() => cfn(parents.map(n => this.currentGroup[n].gene)),
                  parents.map(n => this.currentGroup[n].id)));
      parents.forEach(n => fit[n] = this.currentGroup[n].fit);
    }
    [this.currentGroup, this.targetGroup] = [this.targetGroup, this.currentGroup];
    // this.currentGroup = this.targetGroup;
    this.history.push(this.currentGroup);
    return this;
  }
  this.show = file => {
    const str = this.currentGroup.reduce((a, c) => a + c.value + "\n", "");
    if (file) {
      const FS = require("fs");
      FS.writeFileSync(file, str);
    } else
      p(str);
    return this;
  }
  this.import = (a) => {
    // this.poolSize = a.poolSize;
    this.geneSize = a.geneSize;
    this.pool = (new Pool).import(a.pool);
    const toO = id => this.pool.at(id);
    this.history = a.history.map(g => g.map(toO));
    this.currentGroup = a.currentGroup.map(toO);
    this.targetGroup = a.targetGroup.map(toO);
    return this;
  }
  this.export = () => {
    const toA = ind => ind.id;
    return data = {
      // poolSize: this.poolSize,
      geneSize: this.geneSize,
      pool: this.pool.export(),
      history: this.history.map(g => g.map(toA)),
      currentGroup: this.currentGroup.map(toA),
      targetGroup: this.targetGroup.map(toA)
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
GA.prototype.createOne = function(fn, origin) {
  return this.pool.spawn().create(fn, origin || null).tap(ind =>
    this.targetGroup.push(ind));
}
GA.prototype.selectTwo = function(selectFn) {
  const fit = Float64Array.from(this.currentGroup, ind => ind.fit);
  const parents = [];
  for (let j = 0; j < 2; ++j) {
    const index = selectFn(fit);
    if (index < 0) {
      console.log("Error: in GABase.roulette");
      return;
    }
    parents.push(index);
    fit[index] = 0;
  }
  return parents.map(idx => this.currentGroup[idx].id);
}
GA.prototype.matingOne = function(matingFn, origin) {
  const parntsGene = origin.map(id => this.pool.at(id).gene);
  return this.createOne(() => matingFn(parntsGene), origin);
}

// #############################################################################

const creteGAHandle = geneSize => {
  // const poolSize = 100;
  // const geneSize = 5;
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
  };

  const randomGen = () => times(geneSize, Math.random); // 初期化子1
  // const createGen = parents =>

  const selection = GABase.roulette;
  const blx = GABase.createBLX(0.5);
  const pmu = GABase.createPMU(20);
  const mating = a => {
    const b = blx(a[0], a[1]);
    return Math.random() < 0.01 ? pmu(b) : b;
  };

  let generation = 0;

  // const ga = new GA(poolSize, geneSize, compareFn);

  return {
    _ready: false,
    _ga: new GA(geneSize, compareFn),
    get currentGroup() { return this._ga.currentGroup; },
    get targetGroup() { return this._ga.targetGroup; },
    get current_id() { return this._ga.pool.current_id; },
    get generation() { return generation; },

    createRandom: function(objFn) {
      const ind = this._ga.createOne(randomGen);
      return objFn ? ind.eval(objFn) : ind;
    },
    evalAll: function(objFn) { return this._ga.eval(objFn); },
    swapGroup: function() { return this._ga.swapGroup(); },
    matingOne: function(origin, objFn) {
      const ind = this._ga.matingOne(mating, origin);
      return objFn ? ind.eval(objFn) : ind;
    },
    selectTwo: function(selectFn) { return this._ga.selectTwo(selectFn); },

    call: function() {
      if (!this._ready) {
        this._ga.init();
        this._ready = true;
      } else {
        this._ga.advance(selection, mating);
        ++generation;
      }
      this._ga.eval(funcZDT1);
      return this;
    },
    reset: function() {
      this._ga = new GA(geneSize, compareFn);
      this._ready = false;
      generation = 0;
      return this;
    }
  }
}

// #############################################################################

global.GA1 = {
  creteGAHandle: creteGAHandle
};

})(this);
