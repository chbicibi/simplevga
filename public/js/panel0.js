(function(global) {
"use strict";

const test0 = tabName => {
  const gaHandle = GA0.creteGAHandle(100).call();

  const mainPanel = new Root("main_panel");
  const controlPanel = new Panel("panel control_panel", mainPanel);
  const displayPanel = new Panel("panel display_panel", mainPanel);
  const consolePanel = new ConsolePanel("panel console_panel", mainPanel);

  const buttons = [
    new Button("button", controlPanel, "ボタン1").activate(),
    new Button("button", controlPanel, "ボタン2").activate(),
    new Button("button", controlPanel, "ボタン3").activate()
  ];

  const data0 = [4, 8, 15, 16, 23, 42].map(n=>["no", n]);
  const data1 = [3, 7, 22, 10, 4];
  const elem = displayPanel.elem.appendChild(document.createElement("div"));

  const selector0 = d3.select(elem)
                      .classed("chart", true)
                      .append("svg")
                      .attr("width", 400)
                      .attr("height", 400)
                      // .transition().duration(200)
                      .append("g")
                      .selectAll("circle")
                      .data(gaHandle.group0)
                      .enter()
                      .append("circle")
                      .classed("ind", true)
                      .attr("cx", ind => 300 * ind.value[0])
                      .attr("cy", ind => 300 * ind.value[1])
                      .attr("r", 5)
                      .on("click", ind => p("id: " + ind.id + " value: " + ind.value));

  buttons[0].action = () => {
    gaHandle.call()
    selector0.data(gaHandle.group0)
             .attr("cx", ind => 300 * ind.value[0])
             .attr("cy", ind => 300 * (1-ind.value[1]));
  }

 // selector.exit()
 //         .remove()
 //         .style("height", d => {p("remove: "+d);return d[1] + "px";});

  // selector.style("height", d => {p("update: "+d);return d[1] + "px";});

  // d3.select(elem)
  //   .selectAll("div")
  //   .data(data1)
  //   // .exit()
  //   // .remove()
  //   .style("height", d => {p("update: "+d);return d + "px";});


  // p(document.getElementById("ws").children).forEach(e => elem.appendChild(e));

  return mainPanel.toElement();
}

const panel_ga0 = tabName => {
  const gaHandle = GA0.creteGAHandle(100);

  const mainPanel = new Root("main_panel");
  const controlPanel = new Panel("panel control_panel", mainPanel);
  const displayPanel = new Panel("panel display_panel", mainPanel);
  const consolePanel = new ConsolePanel("panel console_panel", mainPanel);
  const flowPanel = new Panel("panel flow_panel", displayPanel);
  const dataPanel = new Panel("panel data_panel", displayPanel);
  const analysisPanel = new Panel("panel analysis_panel", displayPanel);
  const groupPanel0 = new GroupPanel("group", dataPanel, consolePanel);
  const image = new ImagePanel("image", dataPanel, "image/down_arrow.svg");
  const groupPanel1 = new GroupPanel("group", dataPanel, consolePanel);
  const flag = { sort: false };

  flowPanel.list = (() => {
    return flowPanel.elem.appendChild(document.createElement("ul"));
  })();
  flowPanel.add = n => {
    const li = flowPanel.list.appendChild(document.createElement("li"));
    li.textContent = "generation" + n;
  }

  const indivInfoPanel = new ConsolePanel("panel indiv_info_panel", analysisPanel);
  groupPanel0.infoPanel = indivInfoPanel;
  groupPanel1.infoPanel = indivInfoPanel;

  const chartPanel = new Panel("panel chart_panel c0", analysisPanel);
  const scatterPanel = new Panel("panel chart_panel c1", analysisPanel);

  // ---------------------------------------------------------------------------

  const history = h => h.map((g, i) => [i, Math.min.apply(null, g.map(ind => ind.value[1]))]);
  const scatter = g => g.map(ind => ind.value);

  const showGroupPanel = isSorted => {
    if (isSorted) {
      const fn = (a, b) => a.fit - b.fit;
      groupPanel0.toPanel(gaHandle.group1.slice().sort(fn));
      groupPanel1.toPanel(gaHandle.group0.slice().sort(fn));
    } else {
      groupPanel0.toPanel(gaHandle.group1);
      groupPanel1.toPanel(gaHandle.group0);
    }
    Flotr.draw(chartPanel.elem,
               [{
                  data: history(gaHandle._ga.history),
                  lines: {show:true}
                }]);//, { xaxis: { showLabels: false } });
    // p("history:" + history(gaHandle._ga.history));
    Flotr.draw(scatterPanel.elem,
               [{
                  data: scatter(gaHandle.group0),
                  points: {show:true}
                }]);
    flowPanel.add(gaHandle.generation);
  }

  new Button("button", controlPanel, "初期化").tap(_ => _.setAction(() => {
    gaHandle.reset().call();
    groupPanel0.toPanel(gaHandle.group0);
    groupPanel1.toPanel();
    _.parent.children[1].activate();
    _.parent.children[2].activate().turnOff();
    flag.sort = false;
    flowPanel.add(gaHandle.generation);
    consolePanel.log("[初期化]");
  })).activate();

  new Button("button", controlPanel, "世代交代").setAction(() => {
    gaHandle.call();
    showGroupPanel(flag.sort);
    consolePanel.log("[世代交代] 個体総数: " + gaHandle.current_id);
  });

  new Button("button", controlPanel, "ソート").tap(_ => _.setAction(() => {
    flag.sort = !flag.sort;
    showGroupPanel(flag.sort);
    if (flag.sort) {
      _.turnOn();
      consolePanel.log("[ソート]");
    } else {
      _.turnOff();
      consolePanel.log("[ソート解除]");
    }
  }));

  new Button("button", controlPanel, "保存").setAction(() => {
    const res = {}.tap(_ => gaHandle._ga.save(tabName, _));
    const message = "[保存] " + (res.old ? "上書き" : "新規") +
      ` keys: [${Object.keys(localStorage)}]`;
    consolePanel.log(message);
  }).activate();

  new Button("button", controlPanel, "読み込み").setAction(() => {
    const res = gaHandle._ga.load(tabName);
    if (res) showGroupPanel(flag.sort);
    const message = "[読み込み] " + (res ? "成功" : "失敗") +
      ` keys: [${Object.keys(localStorage)}]`;
    consolePanel.log(message);
  }).activate();

  new Button("button", controlPanel, "ダウンロード")
    .setAction(() => downloadAsFile("test.json", gaHandle._ga.save()))
    .tap(_ => _.elem.style.fontSize = "1.2rem")
    /*.activate()*/;

  new Button("button", controlPanel, "アップロード")
  .setAction(() => {
    uploadAsText(text => {
      const res = gaHandle._ga.import(JSON.parse(text));
      if (res) showGroupPanel(flag.sort);
      consolePanel.log(res ? "[読み込み] 成功" : "[読み込み] 失敗");
    });
  })
  .tap(_ => _.elem.style.fontSize = "1.2rem")
  /*.activate()*/;

  return mainPanel.toElement();
}

const test1 = () => {
  const mainPanel = new Root("main_panel");
  const controlPanel = new Panel("control_panel", mainPanel);
  const displayPanel = new Panel("display_panel", mainPanel);
  const button = new Button("button", controlPanel, "実行").activate();

  const fn = (downloader) => {
    const url = "https://api.github.com/search/repositories?q=javascript";
    const xhr = new XMLHttpRequest();
    xhr.onload = () => downloader(xhr.response);
    xhr.open("GET", url);
    xhr.send();
    // xhr.abort();
  }

  button.setAction(() => fn((_) => downloadAsFile("test_ajax.json", _)));
  return mainPanel.toElement();
}

global.PanelTest = {
  create: test0
};
global.Panel0 = {
  create: panel_ga0
};

})(this);
