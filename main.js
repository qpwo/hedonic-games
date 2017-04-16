var s = new sigma('innergraphbox');

var totalNumNodes = 0;
var totalNumEdges = 0;

function addRandomNode() {
  s.graph.addNode({
    id: 'n' + totalNumNodes.toString(),
    label: 'n' + totalNumNodes.toString(),
    x: Math.random(),
    y: Math.random(),
    size: 1,
    color: '#F00'
  });
  s.refresh();
  totalNumNodes++;
}

function addNode() {
  var name = document.getElementById('nodeName').value;
  var xPosition = parseFloat(document.getElementById('nodeX').value);
  var yPosition = parseFloat(document.getElementById('nodeY').value);
  s.graph.addNode({
    id: name,
    label: name,
    x: xPosition,
    y: yPosition,
    size: 1,
    color: '#F00'
  });
  s.refresh();
  totalNumNodes++;
}

function addRandomEdge() {
  s.graph.addEdge({
    id: 'e' + totalNumEdges.toString(),
    source: 'n' + Math.floor(Math.random() * totalNumNodes).toString(),
    target: 'n' + Math.floor(Math.random() * totalNumNodes).toString(),
  });
  s.refresh();
  totalNumEdges++;
}

function addEdge() {
  var source = document.getElementById('edgeSource').value;
  var target = document.getElementById('edgeTarget').value;
  s.graph.addEdge({
    id: 'e' + totalNumEdges.toString(),
    source: source,
    target: target,
  });
  s.refresh();
  totalNumEdges++;
}

function addList() {
  var bigString = document.getElementById('bigString').value;
  var lines = bigString.split('\n');
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i].replace(/ /g, '');
    var split1 = line.split(':');
    var source = split1[0];
    var targets = split1[1].split(',');
    for (var j = 1; j < targets.length; j++) {
      console.log("Adding edge from", source, "to", targets[j], ".");
      s.graph.addEdge({
        id: 'e' + totalNumEdges.toString(),
        source: source,
        target: targets[j]
      });
      totalNumEdges++;
    }
  }
  s.refresh();
}
