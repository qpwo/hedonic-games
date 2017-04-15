current_node_count = 0;

function addNode()
{
    name = document.getElementById('nodeName').value;
    xPosition = parseFloat(document.getElementById('nodeX').value);
    yPosition = parseFloat(document.getElementById('nodeY').value);
    current_node_count = current_node_count + 1;
  s.graph.addNode({
    id: 'n' + current_node_count.toString(),
    label: name,
    x: xPosition,
    y: yPosition,
    size: 1,
    color: '#F00'
  });
  s.refresh();
}
