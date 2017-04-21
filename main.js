
// ** necessary globals for setting up a user session **

var s = new sigma("innergraphbox"); // the thing controlling/displaying the graph
sigma.plugins.dragNodes(s, s.renderers[0]); // enable click and drag
var partition = []; // current partition of the vertices
var graph = {}; // a map from nodes to arrays of nodes
var scoreFunc = FOScore; // function to use for player type

// ** Useful Methods for Graphs **

function addNode(name, x=Math.random(), y=Math.random()) {
  // add a node to the graph
  name = (name ? name : 'n' + s.graph.nodes().length.toString());
  if (s.graph.nodes(name)) return; // don't add the node if there's already one with the same name
  s.graph.addNode({
    id: name,
    label: name,
    x: x,
    y: y,
    size: 1,
    color: '#000'
  });
  s.refresh();
}

function addEdge(source, target) {
  if (source == target) return; // don't add edge loops
  name = source + '-' + target;
  if (s.graph.edges(name)) return; // don't add already existing edges
  s.graph.addEdge({
    id: name,
    source: source,
    target: target
  });
}

function drawGraphFromTextButton() {
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
      if (!target) continue; // empty target list
      addNode(target);
      addEdge(source, target);
      addEdge(target, source);
    }
  }
  graph = collectGraph(); // update the global graph object
  s.refresh();
}


function makePartitionFromTextButton() {
  // set the partitions to the ones described by the user and color them
  // also, it sorts everything
  var bigString = document.getElementById('partitionTextField').value;
  var lines = bigString.split('\n');
  var possiblePartition = lines.map(line => line.replace(/ /g, '').split(','));
  var nodes = s.graph.nodes().map(nodeO => nodeO.id);
  if (!isPartition(nodes, possiblePartition)) {
    window.alert("This is not a valid partition. Every node must occur on " +
      "exactly one line. (Commas seperate nodes.)");
    return;
  }
  partition = [];
  partition = possiblePartition.map(arr => arr.sort()).sort(
    function(arr1,arr2) {
      var str1 = JSON.stringify(arr1);
      var str2 = JSON.stringify(arr2);
      if (str1 > str2) return 1;
      if (str1 < str2) return -1;
      return 0;});
  partition.forEach(coalition => colorSubgraph(coalition, randomColor()));
}

function colorSubgraph(nodes, color) {
  // color a subgraph induced by a set of nodes
  for (let nodeObject of s.graph.nodes(nodes))
    nodeObject.color = color;
  s.refresh();
}

function randomColor() {
  // generates a random hex color code
  return '#'+Math.random().toString(16).substr(-6);
}

function collectGraph() {
  // make a simple node to node array map from the complex nodejs graph
  // also, it sorts everything
  var graph = {};
  var nodes = s.graph.nodes().map(node=>node.id).sort();
  for (const node of nodes)
    graph[node] = [];
  for (const edge of s.graph.edges())
    graph[edge.source].push(edge.target);
  for (const node of nodes)
    graph[node].sort();
  return graph;
}

// ** Buttons for Webpage **

function displayScoresButton() {
  result = "<table>";
  result += "<tr><th></th>";
  for (const coalition of partition)
    result += "<th>" + coalition.toString() + "</th>";
  result += "</tr>";
  for (const node of Object.keys(graph)) {
    result += "<tr> <th>" + node + "</th>"; // start a new row
    for (const coalition of partition) {
      var score = scoreFunc(graph, node, coalition); 
      result += "<td>" + score.toString() + "</td>"; // add a score
    }
    result += "</tr>";
  }
  result += "</table>";
  document.getElementById("scoreParagraph").innerHTML = result;
}

function setPlayerTypeButton() {
  var nameToFunc = {"EQ": FOEQScore, "AL":FOALScore, "SF":FOSFScore, "simple":FOScore};
  var selection = document.getElementById("playerTypePicker").value;
  scoreFunc = nameToFunc[selection];
}

function individuallyRationalButton() {
  // check if the partition is individually rational and display result
  [isIR, node] = isIndividuallyRational(graph, partition);
  var result = "";
  if (isIR)
    result = "Yes this partition is individually rational!";
  else
    result = "No. Node '" + node + "' would rather be alone.";
  document.getElementById("individuallyRationalParagraph").innerHTML = result;
}

function perfectButton() {
  // check if the partition is perfect and display result
  [isP, node, favoriteCoalitions] = isPerfect(graph, partition, scoreFunc);
  var result = "";
  if (isP)
    result = "Yes, this is the perfect partition.";
  else {
    result = "No, node '" + node + "' would rather be in coalition [" +
      favoriteCoalitions[node] + "].\n";
    result += "All favorite coalitions:\n <ul>";
    for (const node of Object.keys(favoriteCoalitions))
      result += "<li>" +  node + " : " + favoriteCoalitions[node] + "</li>\n";
    result += "</ul>";
  }
  document.getElementById("perfectParagraph").innerHTML = result;
}

function coreStableButton() {
  [isCS, coalition] = isCoreStable(graph, partition, scoreFunc);
  var result = "";
  if (isCS)
    result = "Yes, this partition is core stable";
  else
    result = "No, the coalition [" + coalition + "] wants to elope.";
  document.getElementById("coreStableParagraph").innerHTML = result;
}

function nashStableButton() {
  [isNS, node, coalition] = isNashStable(graph, partition, scoreFunc);
  var result = "";
  if (isNS)
    result = "Yes, this partition is Nash stable.";
  else
    result = "No, node '" + node + "' would rather be in coalition [" + coalition + "].";
  document.getElementById("nashStableParagraph").innerHTML = result;
}

function strictlyPopularButton() {
  [isSP, partition] = isStrictlyPopular(graph, partition, scoreFunc);
  var result = "";
  if (isSP)
    result = "Yes, this partition is Strictly Popular.";
  else
    result = "No, partition " + JSON.stringify(partition) + " is preferred overall.";
  document.getElementById("strictlyPopularParagraph").innerHTML = result;
}

// ** Helper Functions for Buttons **

function isPartition(arr, arrArr) {
  // checks if the arrArr is a partition of the arr
  var concatified = [].concat.apply([],arrArr);
  return (concatified.length == arr.length) && arr.every(x => concatified.includes(x));
}
