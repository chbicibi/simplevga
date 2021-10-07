(function(global) {
"use strict";

const createSVG = (width, height, name) => {
  const margin = {top: 5, right: 5, bottom: 20, left: 20};
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  const w = width + margin.left + margin.right;
  const h = height + margin.top + margin.bottom;
  svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  svg.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");
  svg.setAttribute("width", w);
  svg.setAttribute("height", h);
  svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
  if (name) svg.setAttribute("class", name);
  svg.margin = margin;
  return svg;
}

const scatter = (svg, width, height, data) => {
  const xScale = d3.scaleLinear().domain([0, 1]).range([0, width]);
  const yScale = d3.scaleLinear().domain([0, 1]).range([height, 0]);

  const selector = d3.select(svg)
                      .append("g")
                      .selectAll(".dot")
                      .data(data)
                      .enter()
                      .append("circle")
                      .classed("dot", true)
                      .on("click", d => d.a())
                      .attr("cx", d => xScale(d.x))
                      .attr("cy", d => yScale(d.y / 5))
                      .attr("r", 4)
                      .attr("fill","none")
                      .attr("stroke-width", 2)
                      .attr("stroke", "blue");
  selector.xScale = xScale;
  selector.yScale = yScale;
  return selector
}

const temp = (svg, width, height, data) => {
  const xScale = d3.scaleLinear().domain([0, 1]).range([0, width]);
  const yScale = d3.scaleLinear().domain([0, 1]).range([height, 0]);

  const selector = d3.select(svg)
                      .append("g")
                      .selectAll(".dot")
                      // .data(data)
                      // .enter()
                      .append("circle")
                      .classed("dot", true)
                      // .on("click", d => d.a())
                      // .attr("cx", d => xScale(d.x))
                      // .attr("cy", d => yScale(d.y / 5))
                      .attr("r", 4)
                      .attr("fill","none")
                      .attr("stroke-width", 2)
                      .attr("stroke", "blue");
  selector.xScale = xScale;
  selector.yScale = yScale;
  return selector
}


// #############################################################################

global.Plot = {
  createSVG: createSVG,
  scatter: temp
};

})(this);
