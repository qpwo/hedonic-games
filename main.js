var s = new sigma('innergraphbox');

var totalNumNodes = 0;
var totalNumEdges = 0;

function readTextFile(file)
{
    var rawFile = new XMLHttpRequest();
    rawFile.open("GET", file, false);
    rawFile.onreadystatechange = function ()
    {
        if (rawFile.readyState === 4)
        {
            if (rawFile.status === 200 || rawFile.status == 0)
            {
                var allText = rawFile.responseText;
                return allText;
            }
        }
    }
    rawFile.send(null);
}

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

function readJSON()
{
    sigma.parsers.json(
        'sample.json',
        s,
        function() {
            s.refresh();
        }
    );
}


function displayNetwork() {
  document.getElementById("outputString").innerHTML = "Computing...";
  var nodes = s.graph.nodes();
  var edges = s.graph.edges();
  var graph = {};
  for (var i = 0; i < nodes.length; i++) {
    graph[nodes[i].id] = [];
  }
  for (p in graph) {
    console.log(p);
  }
  for (var i = 0; i < edges.length; i++) {
    var edge = edges[i];
    graph[edge.source].push(edge.target);
  }
  result = "";
  for (var i = 0; i < nodes.length; i++) {
    node = nodes[i].id;
    result += node + ":" + graph[node].toString() + "<br/>";
  }
  document.getElementById("outputString").innerHTML = result;
}
