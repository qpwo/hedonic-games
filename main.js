var s = new sigma('innergraphbox');

var totalNumNodes = 0;

function addRandomNode() {
  totalNumNodes++;
  s.graph.addNode({
    id: 'n' + totalNumNodes.toString(),
    label: 'node number ' + totalNumNodes.toString(),
    x: Math.random(),
    y: Math.random(),
    size: 1,
    color: '#F00'
  });
  s.refresh();
}

function addNode()
{
    name = document.getElementById('nodeName').value;
    xPosition = parseFloat(document.getElementById('nodeX').value);
    yPosition = parseFloat(document.getElementById('nodeY').value);
    totalNumNodes = totalNumNodes + 1;
  s.graph.addNode({
    id: 'n' + totalNumNodes.toString(),
    label: name,
    x: xPosition,
    y: yPosition,
    size: 1,
    color: '#F00'
  });
  s.refresh();
}
