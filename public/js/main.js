(function(global) {
"use strict";

const clearElements = elem => {
  while (elem.firstChild) elem.removeChild(elem.firstChild);
  return elem;
}

const onload = () => {
  const rootPanel = document.getElementById("root_panel");
  const sidePanel = document.getElementById("side_panel");
  const mainPanel = [
    ["ステップ実行0", Panel1.create("page1")],
    ["ステップ実行1", Panel1.create("page1")],
    ["デモ0", Panel0.create("page0")]
  ];
  sidePanel.pre = null;

  mainPanel.forEach(e => {
    const li = sidePanel.appendChild(document.createElement("li"));
    li.innerText = e[0];
    li.onclick = () => {
      if (sidePanel.pre) sidePanel.pre.classList.remove("selected");
      sidePanel.pre = li;
      li.classList.add("selected");
      clearElements(rootPanel);
      rootPanel.appendChild(e[1]);
      return li;
    }
  });
  sidePanel.firstChild.onclick();
}

global.onload = onload;

})(this);
