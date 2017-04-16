function readTextFile(file) {
  // does ...
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

var s = new sigma('innergraphbox');

var totalNumNodes = 0;
var totalNumEdges = 0;


function addRandomNode() {
  // add a random node to the graph
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
  // add a node to the graph using the fields from the webpage
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
  // add a random edge to the graph
  s.graph.addEdge({
    id: 'e' + totalNumEdges.toString(),
    source: 'n' + Math.floor(Math.random() * totalNumNodes).toString(),
    target: 'n' + Math.floor(Math.random() * totalNumNodes).toString(),
  });
  s.refresh();
  totalNumEdges++;
}

function addEdge() {
  // add an edge to the graph using the fields specified on the webpage
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
  // add all the edges to the graph that are described in the big text field
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
    fileName = document.getElementById("getFile").value;
    sigma.parsers.json(
        fileName,
        s,
        function() {
            s.refresh();
        }
    );
}

function makeGraphObject() {
  // collects all the nodes and edges and puts a simplified version in an object
  var nodes = s.graph.nodes();
  var edges = s.graph.edges();
  var graph = {};
  for (var i = 0; i < nodes.length; i++) {
    graph[nodes[i].id] = [];
  }
  for (var i = 0; i < edges.length; i++) {
    var edge = edges[i];
    graph[edge.source].push(edge.target);
  }
  return graph;
}


function displayNetwork() {
  // puts the current displayed graph into a textbox on the webpage
  var graph = makeGraphObject();
  var result = "";
  for (node in graph) {
    result += node + ":" + graph[node].toString() + "<br/>";
  }
  document.getElementById("outputString").innerHTML = result;
}
