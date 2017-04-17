var s = new sigma("innergraphbox");
var partition = [];

function addNode(name, x, y) {
  // add a random node to the graph
  if (!name) {
    name = 'n' + s.graph.nodes().length.toString();
  }
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

addNode();
addNode();
addNode();

function drawGraphFromText() {
  // replace the current graph with the one described in the big text box on the webpage
  s.graph.clear();
  var bigString = document.getElementById('graphTextField').value;
  var lines = bigString.split('\n');
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i].replace(/ /g, '');
    var split1 = line.split(':');
    var source = split1[0];
    if (!s.graph.nodes(source))
      addNode(source);
    var targets = split1[1].split(',');
    for (var j = 0; j < targets.length; j++) {
      var target = targets[j];
      if (!s.graph.nodes(target))
        addNode(target);
      s.graph.addEdge({
        id: 'edge' + source + '-' + target,
        source: source,
        target: target
      });
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
