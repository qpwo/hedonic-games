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
  name = document.getElementById('nodeName').value;
  xPosition = parseFloat(document.getElementById('nodeX').value);
  yPosition = parseFloat(document.getElementById('nodeY').value);
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
  source = document.getElementById('edgeSource').value;
  target = document.getElementById('edgeTarget').value;
  s.graph.addEdge({
    id: 'e' + totalNumEdges.toString(),
    source: source,
    target: target,
  });
  s.refresh();
  totalNumEdges++;
}
