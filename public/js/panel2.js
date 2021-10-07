(function(global) {
"use strict";

const indPrinter = ind => {
  const id = "id: " + ind.id;
  const gene = "gene: " + ind.gene.map(_ => _.toPrecision(4));
  const value = "value: " + (ind.value ? ind.value.map(_ => _.toPrecision(4)) : "未評価");
  const fit = "fit: " + ind.fit.toPrecision(3);
  const rank = "rank: " + ind.rank;
  const origin = "origin: " + (ind.origin || "none");

  if (!ind.value) {
    this.selected[ind.id] = 1;
    this.log(`[選択] ${id} ${value}`);
    this.infoPanel.p(`[Indiv] ${id}\n${gene}\n${value}\n${origin}`);
  } else {
    const id = "id: " + ind.id;
    const gene = "gene: " + ind.gene.map(_ => _.toPrecision(4));
    const value = "value: " + ind.value.map(_ => _.toPrecision(4));
    const origin = "origin: " + (ind.origin || "none");
    this.selected[ind.id] = 1;
    this.log(`[選択] ${id} ${value} ${fit} ${rank}`);
    this.infoPanel.p(`[Indiv] ${id}\n${gene}\n${value}\n${fit}\n${rank}\n${origin}`);
  }
}


})(this);
