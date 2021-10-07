(function(global) {
"use strict";

// デバイス
// const Controller = {};
// const Console = {};
// const Display = {};
const model = {
  currentGroup: [],
  targetGroup: []
};

const newElem = (tag, attr) =>
  document.createElement(tag)
          .tap(e => {for (const key of Object.keys(attr)) e[key] = attr[key]});

// #############################################################################

const IndivData = function() {
  this.id = null;
  this.data = null;
  this.focus = false;
  this.info = "empty";
  this.call = () => {};
}

const createNewIndiv = () => newElem("div", {className: "indiv empty focus"});
  // document.createElement("div")
  //         .tap(e => e.className = "indiv empty focus");
  // elem.focus = function() { this.classList.add("focus"); }
  // elem.color = function() { this.classList.add("focus"); }

const MainFrame = function() {
  this.mainPanel = new Root("main_panel");
  this.controlPanel = new Panel("panel control_panel", this.mainPanel);
  this.displayPanel = new Panel("panel display_panel", this.mainPanel);
  this.consolePanel = new ConsolePanel("panel console_panel", this.mainPanel);
  this.flowPanel = new Panel("panel flow_panel", this.displayPanel);
  this.dataPanel = new Panel("panel data_panel", this.displayPanel);
  this.analysisPanel = new Panel("panel analysis_panel", this.displayPanel);

  this.indivInfoPanel = new ConsolePanel("panel indiv_info_panel", this.analysisPanel);
  this.chartPanel = new Panel("panel chart_panel c0", this.analysisPanel);
  this.scatterPanel = new Panel("panel chart_panel c1", this.analysisPanel);

  this.buttons = [];
  this.inputs = [];
  this.groups = [new GroupPanel("group", this.dataPanel, this.consolePanel)];
  new ImagePanel("image", this.dataPanel, "image/down_arrow.svg");
  this.groups.push(new GroupPanel("group", this.dataPanel, this.consolePanel));
  this.groups.forEach(a => {
    a.infoPanel = this.indivInfoPanel;
  });

  // this.consolePanel.setTitle("console");
}
MainFrame.prototype.addButtons = function(labels) {
  this.buttons = labels.map(text =>
    new Button("button", this.controlPanel, text));
}
MainFrame.prototype.addInputBox = function() {
  const inputBox = new Panel("input_box", this.controlPanel);
  ["objective:", "selection:"].forEach(t =>
    document.createElement("div").tap(a => a.innerText = t).tap(a =>
      inputBox.elem.appendChild(a)));
  this.inputs = [new SelectMenu("select_box", inputBox),
                 new SelectMenu("select_box", inputBox)];
  for (const key of Object.keys(GABase.func)) {
    this.inputs[0].setOption(key, key)
  }
  this.inputs[1].setOption("roulette", "roulette");
}
MainFrame.prototype.updateGroups = function(gaHandle, focus=false) {
  this.groups[0].toPanel(gaHandle.currentGroup);
  this.groups[1].toPanel(gaHandle.targetGroup);
  if (gaHandle.currentGroup.idx >= 0)
  this.groups[0].elem.title = "group" + gaHandle.currentGroup.idx;
  this.groups[1].elem.title = "group" + gaHandle.targetGroup.idx;
  if (focus) this.groups[1].elem.appendChild(createNewIndiv());
  if (this.dotter) this.dotter(this.groups);
}
MainFrame.prototype.setLineSVG = function(gaHandle) {
  const width = 300;
  const height = 120;
  const x_range = [0, 30];
  const y_range = [0, 20];
  const svg = Plot.createSVG(width, height, "line");
  const selector = d3.select(svg)
                     .append("g")
                     .attr("transform",
                           `translate(${svg.margin.left},${svg.margin.top})`);
  const polyline = selector.append('path')
                           .attr('stroke', 'blue')
                           .attr('stroke-width', 3)
                           .attr('fill', 'transparent');
  const xScale = d3.scaleLinear().domain(x_range).range([0, width]);
  const yScale = d3.scaleLinear().domain(y_range).range([height, 0]);
  const line = d3.line()
                 .x(function(d, i) { return xScale(i); })
                 .y(function(d, i) { return yScale(d); });

  const xAxis = d3.axisBottom()
                  .scale(xScale)
                  .ticks(5);
                  // .tickSize(6, 10-height) // 棒の長さと方向。
                  // .tickFormat(function(d){ return d + "*"; });
  const yAxis = d3.axisLeft()
                  .scale(yScale)
                  .ticks(5); // 軸のチックの数。
                  // .tickSize(6, 10-width);

  selector.append("g")
          .attr("class", "x axis")
          .attr("transform", "translate(0," + height + ")")
          .call(xAxis);

  selector.append("g")
          .attr("class", "y axis")
          // .attr("transform", "translate(20,0)")
          .call(yAxis);

  this.chartPanel.clearChildren();
  this.chartPanel.elem.appendChild(svg);

  const getMin = h => h.map((g, i) => Math.min.apply(null, g.map(ind => ind.value[1])));
  const calcHV = GABase.createCalcHV([1, 5]);
  const hv = [];

  this.lineDrawer = history => {
    const hvValue = calcHV(history[history.length - 1]);
    hv.push(p(hvValue));
    polyline.transition()
            .duration(300)
            // .attr("transform", "translate(20,0)")
            // .attr('d', line(getMin(history)));
            .attr('d', line(hv));
  }
}
MainFrame.prototype.setScatterSVG = function() {
  const width = 300;
  const height = 300;
  const svg = Plot.createSVG(width, height, "dot");
  const selector = d3.select(svg)
                     .append("g")
                     .attr("transform",
                           `translate(${svg.margin.left},${svg.margin.top})`);
  const xScale = d3.scaleLinear().domain([0, 1]).range([0, width]);
  const yScale = d3.scaleLinear().domain([0, 5]).range([height, 0]);
  const xAxis = d3.axisBottom()
                  .scale(xScale)
                  .ticks(5);
                  // .tickSize(6, 10-height) // 棒の長さと方向。
                  // .tickFormat(function(d){ return d + "*"; });
  const yAxis = d3.axisLeft()
                  .scale(yScale)
                  .ticks(5); // 軸のチックの数。
                  // .tickSize(6, 10-width);

  selector.append("g")
          .attr("class", "x axis")
          .attr("transform", "translate(0," + height + ")")
          .call(xAxis);

  selector.append("g")
          .attr("class", "y axis")
          // .attr("transform", "translate(20,0)")
          .call(yAxis);

  this.scatterPanel.clearChildren();
  this.scatterPanel.elem.appendChild(svg);

  const g_dots = [selector.append("g")
                          .attr("class", "g_dot0"),
                  selector.append("g")
                          .attr("class", "g_dot1")];

  this.dotter = gp => {
    const dots = g_dots.map((g, i) => g.selectAll(".dot")
                                       .data(gp[i].data));
    dots.forEach((gd, i) => {
      gd.exit()
        .remove();
      gd.enter()
        .append("circle")
        .classed("dot", true)
        .on("click", d => { d.action();
                            gp[i].action();})
        .attr("r", 5)
        .attr("fill", "rgba(0,0,0,0)")
        .attr("stroke-width", 3)
        .merge(gd)
        .transition()
        .duration(300)
        .attr("cx", d => xScale(d.ind.value[0]))
        .attr("cy", d => yScale(d.ind.value[1]))
        .attr("stroke", d => d.selected ? "crimson" :
                             i === 0 ? "forestgreen" :
                                       "royalblue");
    });
    // dots[0].enter()
    //     .append("circle")
    //     .classed("dot", true)
    //     .on("click", d => { d.action();
    //                         gp[0].action();})
    //     .attr("r", 5)
    //     .attr("fill", "rgba(0,0,0,0)")
    //     .attr("stroke-width", 3)
    //     .merge(dots0)
    //     .transition()
    //     .duration(300)
    //     .attr("cx", d => xScale(d.ind.value[0]))
    //     .attr("cy", d => yScale(d.ind.value[1]))
    //     // .attr("fill", d => COLOR.toHue(d.ind.fit))
    //     .attr("stroke", d => d.selected ? "crimson" : "forestgreen");
    // dots1.enter()
    //     .append("circle")
    //     .classed("dot1", true)
    //     .on("click", d => { d.action();
    //                         gp[1].action();})
    //     .attr("r", 5)
    //     .attr("fill", "rgba(0,0,0,0)")
    //     .attr("stroke-width", 3)
    //     .attr("stroke-linecap", "round")
    //     .attr("stroke-dasharray", "2 2")
    //     .merge(dots1)
    //     .transition()
    //     .duration(300)
    //     .attr("cx", d => xScale(d.ind.value[0]))
    //     .attr("cy", d => yScale(d.ind.value[1]))
    //     .attr("stroke", d => d.selected ? "crimson" : "royalblue");
  }
}
MainFrame.prototype.step0 = function(gaHandle) { // 初期化
  gaHandle.reset()
  this.groups[0].selected = {};
  this.updateGroups(gaHandle, true);
  this.buttons[2].deactivate();
  this.buttons[3].deactivate();
  this.buttons[4].deactivate();
  this.buttons[5].deactivate();
}
MainFrame.prototype.step1 = function(gaHandle) { // ランダム作成
  const objFn = GABase.func[this.inputs[0].getValue()];
  gaHandle.createRandom(objFn)
  this.updateGroups(gaHandle, true);
  this.buttons[2].activate();
  this.buttons[3].deactivate();
}
MainFrame.prototype.step2 = function(gaHandle) { // 評価
  gaHandle.evalAll(GABase.func[this.inputs[0].getValue()]);
  this.updateGroups(gaHandle, true);
  this.buttons[3].activate();
}
MainFrame.prototype.step3 = function(gaHandle) { // 世代交代
  gaHandle.swapGroup();
  this.groups[0].selected = {};
  this.updateGroups(gaHandle, true);
  this.buttons[2].deactivate();
  this.buttons[3].deactivate();
  this.buttons[4].activate();
  this.buttons[5].deactivate();
  this.lineDrawer(gaHandle._ga.history);
}
MainFrame.prototype.step4 = function(gaHandle) { // 選択
  const origin = gaHandle.selectTwo(GABase.roulette);
  this.consolePanel.log("[選択] " + origin)
  this.groups[0].selected = {}.tap(_ => origin.forEach(id => _[id] = 1));
  this.updateGroups(gaHandle, true);
  this.buttons[5].activate();
}
MainFrame.prototype.step5 = function(gaHandle) { // 交叉
  const objFn = GABase.func[this.inputs[0].getValue()];
  gaHandle.matingOne(Object.keys(this.groups[0].selected), objFn);
  this.updateGroups(gaHandle, true);
  this.buttons[2].activate();
  this.buttons[3].deactivate();
}

const TestClass = class extends Panel {
  constructor(name, parent) {
    super(name, parent);
  }

  method0() {}
}


const create = tabName => {
  const popSize = 100;
  const geneSize = 5;
  const gaHandle = GA1.creteGAHandle(geneSize);

  // gaHandle.createRandom();
  // p(gaHandle._ga.currentGroup);
  // p(gaHandle._ga.targetGroup);

  const mainFrame = new MainFrame();
  mainFrame.groups[0].tap(a => a.setAction(() => {
    if (Object.keys(a.selected).length == 2)
      mainFrame.buttons[5].activate();
    else
      mainFrame.buttons[5].deactivate();
    mainFrame.updateGroups(gaHandle, true);
  }));
  mainFrame.groups[1].tap(a => a.setAction(() => {
    a.selected = {};
    if (Object.keys(a.selected).length == 2)
      mainFrame.buttons[5].activate();
    else
      mainFrame.buttons[5].deactivate();
    mainFrame.updateGroups(gaHandle, true);
  }));

  mainFrame.addButtons(["初期化", "ランダム作成", "評価", "世代交代", "選択", "交叉"]);

  mainFrame.buttons[0].setAction(() => mainFrame.step0(gaHandle))
                      .activate();
  mainFrame.buttons[1].setAction(() => mainFrame.step1(gaHandle))
                      .tap(_ => _.elem.style.fontSize = "1.2rem")
                      .activate();
  mainFrame.buttons[2].setAction(() => mainFrame.step2(gaHandle));
  mainFrame.buttons[3].setAction(() => mainFrame.step3(gaHandle));
  mainFrame.buttons[4].setAction(() => mainFrame.step4(gaHandle));
  mainFrame.buttons[5].setAction(() => mainFrame.step5(gaHandle));
  // mainFrame.buttons[6].setAction(() => mainFrame.step6(gaHandle)).activate();

  mainFrame.updateGroups(gaHandle, true);
  mainFrame.addInputBox();

  mainFrame.setLineSVG();
  mainFrame.setScatterSVG();

  // mainFrame.buttons[2].setAction(() => {
  //   gaHandle.createRandom();
  //   p(gaHandle._ga.currentGroup);
  //   p(gaHandle._ga.targetGroup);
  // }).activate();


  return mainFrame.mainPanel.toElement();
}

global.Panel1 =  {
  create: create
};

})(this);
