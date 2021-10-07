(function(global) {
"use strict";

const Util = {
  createFlipper: a => {
    const mem = [a, null];
    return c => {
      mem.reverse();
      mem[0] = c;
      return mem[1];
    };
  },
  downloadAsFile: (fileName, content) => {
    const blob = new Blob([content], {type: "application/json"});

    if (navigator.msSaveBlob) {
      navigator.msSaveBlob(blob, fileName);
      // navigator.msSaveOrOpenBlob(blob, fileName);
    } else {
      const a = document.createElement('a');
      a.download = fileName;
      a.href = URL.createObjectURL(blob);
      a.click();
    }
  },
  uploadAsText: callback => {
    const showOpenFileDialog = () => {
      return new Promise(resolve => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".json,application/json";
        input.onchange = event => resolve(event.target.files[0]);
        input.click();
      });
    };
    const readAsText = file => {
      return new Promise(resolve => {
        const reader = new FileReader();
        reader.readAsText(file);
        reader.onload = event => resolve(event.target.result);
      });
    };
    (async () => {
      const file = await showOpenFileDialog();
      const content = await readAsText(file);
      callback(content);
    })();
  }
}

const COLOR = {
  toHue: v => {
    if (!v) return "#666666";
    const scol = ("0" + Math.min(255,
                            50 + Math.floor(128 * (1 - Math.cos(PI4 * v))))
                        .toString(16)).slice(-2);
    return "#" + (v > 1    ? "ff" + "ff" + "ff" :
                  v > 0.75 ? "ff" + scol + "00" :
                  v > 0.5  ? scol + "ff" + "00" :
                  v > 0.25 ? "00" + "ff" + scol :
                  v >= 0   ? "00" + scol + "ff" :
                             "ff" + "ff" + "ff");
  }
}

const getColor = elem => getComputedStyle(elem).backgroundColor;

// #############################################################################

const Tree = function(name, parent) {
  this.name = name;
  this.children = [];
  if (parent) this.attach(parent);
}
Tree.prototype.attach = function(parent) {
  parent.children.push(this);
  this.parent = parent;
  return this;
}
Tree.prototype.forEach = function(fn) {
  fn(this);
  if (this.children)
    this.children.forEach(c => c.forEach(fn));
  return this;
}
Tree.prototype.map = function(ctor, app) {
  return (ctor ? ctor(this) : this).tap(_ => {
    if (this.children)
      this.children.forEach(c => app(_, c.map(ctor, app)));
  });
}

// =============================================================================

const Panel = function(name, parent, cp) {
  Tree.call(this, name, parent);
  this.elem = this.createElement();
  if (this.name) this.elem.className = this.name;
  this.cp = cp;
  this.action = null;
}
inherits(Panel, Tree);
Panel.prototype.createElement = function() {
  return document.createElement("div");
}
Panel.prototype.appendChild = function(child) {
  this.elem.appendChild(child.elem);
}
Panel.prototype.clearChildren = function() {
  this.children = [];
  while (this.elem.firstChild) this.elem.removeChild(this.elem.firstChild);
  return this;
}
Panel.prototype.setAction = function(action) {
  this.action = action;
  this.elem.onclick = action;
  return this;
}
Panel.prototype.setColor = function(color) {
  this.elem.style.backgroundColor = color;
  return this;
}
Panel.prototype.setText = function(text) {
  this.p(text);
  return this;
}
// Panel.prototype.update = function() {
//   return this;
// }
Panel.prototype.toElement = function() {
  return this.map(null, (_, c) => _.appendChild(c)).elem;
}
Panel.prototype.p = function(str) {
  return this.elem.innerText = str;
}
Panel.prototype.log = function(str) {
  if (this.cp) this.cp.log(str);
  else p(str);
  return str;
}
Panel.prototype.setTitle = function(str) {
  if (!this.titleBar) {
    this.titleBar = document.createElement("div");
    this.titleBar.classList.add("title_bar");
    this.content = this.elem;
    this.elem = document.createElement("div");
    this.elem.classList.add("wrapper");
    this.elem.appendChild(this.titleBar);
    this.elem.appendChild(this.content);
    this.appendChild = function(child) {
      return this.content.appendChild(child.elem);
    }
  }
  this.titleBar.innerText = str;
  return this;
}

// =============================================================================

const Root = function(name) {
  Panel.call(this, name);
  // this.elem = document.getElementById(id);
  // this.elem = document.createElement("div");
}
inherits(Root, Panel);

// =============================================================================

const ConsolePanel = function(name, parent) {
  Panel.call(this, name, parent);
}
inherits(ConsolePanel, Panel);
ConsolePanel.prototype.log = function(str) {
  const text = this.elem.innerText + str + "\n";
  this.elem.innerText = text;
  this.elem.scrollTop = this.elem.scrollHeight;
  return text;
}
ConsolePanel.prototype.clear = function() {
  this.elem.innerText = "";
  return this;
}

// =============================================================================

const Button = function(name, parent, text) {
  Panel.call(this, name, parent);
  this.setText(text);
  this.available = false;
}
inherits(Button, Panel);
Button.prototype.createElement = function() {
  return document.createElement("button");
}
Button.prototype.setAction = function(action) {
  this.action = action;
  if (this.available) this.elem.onclick = this.action;
  return this;
}
Button.prototype.activate = function() {
  this.available = true;
  if (this.action) [this.elem.onclick, this.action] = [this.action, null];
  this.elem.classList.add("available");
  return this;
}
Button.prototype.deactivate = function() {
  this.available = false;
  if (this.elem.onclick)
    [this.elem.onclick, this.action] = [null, this.elem.onclick];
  this.elem.classList.remove("available");
  return this;
}
Button.prototype.turnOn = function() {
  this.elem.classList.add("on");
  return this;
}
Button.prototype.turnOff = function() {
  this.elem.classList.remove("on");
  return this;
}

// =============================================================================

const SelectMenu = function(name, parent) {
  Panel.call(this, name, parent);
  // this.select = document.createElement("select");
  // this.elem.innerText = text;
  // this.elem.appendChild(this.select);
}
inherits(SelectMenu, Panel);
SelectMenu.prototype.createElement = function() {
  return document.createElement("select");
}
SelectMenu.prototype.setOption = function(text, value) {
  const option = document.createElement("option");
  option.innerText = text;
  option.value = value;
  this.elem.appendChild(option);
  return this;
}
SelectMenu.prototype.getValue = function() {
  return this.elem.value;
}

// =============================================================================

const ImagePanel = function(name, parent, src) {
  Panel.call(this, name, parent);
  this.elem.src = src;
}
inherits(ImagePanel, Panel);
ImagePanel.prototype.createElement = function() {
  return document.createElement("img")
}

// =============================================================================

const IndivPanel = function(name, parent, cp) {
  Panel.call(this, name, parent, cp);
  this.selected = false;
}
inherits(IndivPanel, Panel);
IndivPanel.prototype.turnOn = function() {
  this.selected = true;
  this.elem.classList.add("on");
  return this;
}
IndivPanel.prototype.turnOff = function() {
  this.selected = false;
  this.elem.classList.remove("on");
  return this;
}
IndivPanel.prototype.toggle = function() {
  this.selected ? this.turnOff() : this.turnOn();
  return this;
}

// =============================================================================

const GroupPanel = function(name, parent, cp) {
  Panel.call(this, name, parent, cp);
  this.blank();
  this.data = [];
  this.selected = {};
  this.indGen = ind =>
    new IndivPanel("indiv", this, this.cp).tap(_ => {
      _.ind = ind;
      _.setText(ind.id)
       .setColor(COLOR.toHue(ind.fit))
       .setAction(() => {
        _.toggle();
        if (this.selected[ind.id]) {
          delete this.selected[ind.id];
          this.log(`[選択解除] id: ${ind.id}`);
          this.infoPanel.clear();
        } else if (!ind.value) {
          const id = "id: " + ind.id;
          const gene = "gene: " + ind.gene.map(_ => _.toPrecision(4));
          const value = "value: 未評価";
          const origin = "origin: " + (ind.origin || "none");
          this.selected[ind.id] = 1;
          this.log(`[選択] ${id} ${value}`);
          this.infoPanel.p(`[Indiv] ${id}\n${gene}\n${value}\n${origin}`);
        } else {
          const id = "id: " + ind.id;
          const gene = "gene: " + ind.gene.map(_ => _.toPrecision(4));
          const value = "value: " + ind.value.map(_ => _.toPrecision(4));
          const fit = "fit: " + ind.fit.toPrecision(3);
          const rank = "rank: " + ind.rank;
          const origin = "origin: " + (ind.origin || "none");
          this.selected[ind.id] = 1;
          this.log(`[選択] ${id} ${value} ${fit} ${rank}`);
          this.infoPanel.p(`[Indiv] ${id}\n${gene}\n${value}\n${fit}\n${rank}\n${origin}`);
        }
      })
      if (this.selected[ind.id]) _.turnOn();
    });
}
inherits(GroupPanel, Panel);
GroupPanel.prototype.toPanel = function(group) {
  this.clearChildren();
  // if (!group || group.length === 0) return this.blank();
  this.filled();
  this.data = group.map(this.indGen);
  this.toElement();
  return this;
}
GroupPanel.prototype.blank = function() {
  this.elem.classList.add("blank");
  return this;
}
GroupPanel.prototype.filled = function() {
  this.elem.classList.remove("blank");
  return this;
}

// #############################################################################

global.COLOR = COLOR;
global.Root = Root;
global.Panel = Panel;
global.ConsolePanel = ConsolePanel;
global.ImagePanel = ImagePanel;
global.GroupPanel = GroupPanel;
global.IndivPanel = IndivPanel;
global.Button = Button;
global.SelectMenu = SelectMenu;

})(this);

/*
【readyStateの値】

値 状態  解説
0 準備段階  まだ通信は行われていない状態
1 準備完了  通信を行う準備が完了している状態
2 通信開始  サーバーと通信が始まっている状態
3 受信中 サーバーから目的のデータを取得している状態
4 通信完了  データを取得し通信が終了している状態
【statusの一般的な値】

値 状態  解説
200 成功  特に問題なく通信が成功した状態
401 エラー 認証が必要になるため通信できない状態
403 エラー アクセスが禁止されており通信できない状態
404 エラー 情報が存在しないために通信できない状態
500 エラー サーバー側に不具合が発生して通信できない状態
503 エラー サーバーに負荷が掛かって通信できない状態
*/
