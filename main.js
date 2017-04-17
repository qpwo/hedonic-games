var s = new sigma("innergraphbox");
var partition = [];

function addNode(name, x, y) {
  // add a random node to the graph
  name = (name ? name : 'n' + s.graph.nodes().length.toString());
  if (!s.graph.nodes(name)) {
    s.graph.addNode({
      id: name,
      label: name,
      x: (x ? x : Math.random()),
      y: (y ? y : Math.random()),
      size: 1,
      color: '#000'
    });
    s.refresh();
  }
}

addNode();
addNode();
addNode();

function addEdge(source, target) {
  name = source + '-' + target;
  if (!s.graph.edges(name)) {
    s.graph.addEdge({
      id: name,
      source: source,
      target: target
    });
  }
}

function drawGraphFromText() {
  // replace the current graph with the one described in the big text box on the webpage
  s.graph.clear();
  var bigString = document.getElementById('graphTextField').value;
  var lines = bigString.split('\n');
  for (const line of lines) {
    var colonSplit = line.replace(/ /g, '').split(':');
    var source = colonSplit[0];
    var targets = colonSplit[1].split(',');
    addNode(source);
    for (let target of targets) {
      addNode(target);
      addEdge(source, target);
      addEdge(target, source);
    }
  }
  s.refresh();
}


function makePartitionFromText() {
  // set the partitions to the ones described by the user and color them
  var bigString = document.getElementById('partitionTextField').value;
  var lines = bigString.split('\n');
  partition = lines.map(function(line) {return line.replace(/ /g, '').split(',');});
  for (let coalition of partition) {
    colorSubgraph(coalition, randomColor());
  }
}

function colorSubgraph(nodes, color) {
  // color a subgraph induced by a set of nodes
  for (let nodeObject of s.graph.nodes(nodes)) {
    nodeObject.color = color;
  }
  s.refresh();
}

function randomColor() {
  // generates a random hex color code
  return '#'+Math.random().toString(16).substr(-6);
}

function collectGraph() {
  var graph = {};
  for (const node of s.graph.nodes()) {
    graph[node.id] = [];
  }
  for (const edge of s.graph.edges()) {
    graph[edge.source].push(edge.target);
  }
  return graph;
}

function FOValue(graph, node, coalition) {
  var n = Object.keys(graph).length;
  var friends = graph[node];
  var value = 0;
  for (const node2 of coalition) {
    if (node != node2)
      value += (friends.includes(node2) ? n : -1);
  }
  return value;
}
