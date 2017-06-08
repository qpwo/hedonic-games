// Luke Miles, June 2017
// Code for all the buttons and things on the front webpage

// TODO: change order of functions
// TODO: make line length more consistent

// ** Necessary globals for setting up a user session **

let SIGMA = new sigma("innergraphbox"); // the thing controlling/displaying the graph
sigma.plugins.dragNodes(SIGMA, SIGMA.renderers[0]); // enable click and drag
SIGMA.settings('zoomingRatio', 1); // scroll doesn't zoom
let PARTITION = new Set(); // current partition of the vertices
let GRAPH = {}; // a map from nodes to arrays of nodes
let SCOREFUNC = FOScore; // function to use for player type

// ** Functions for Reading and Changing the Graph **

function addNode(name=Sigma.graph.nodes().length, x=Math.random(), y=Math.random()) {
  // add a node to the sigma graph
  if (SIGMA.graph.nodes(name)) return; // don't add the node if there's already one with the same name
  SIGMA.graph.addNode({
    id: name,
    label: name,
    x: x,
    y: y,
    size: 1,
    color: '#000'
  });
  SIGMA.refresh();
}

function addEdge(source, target) {
  // add an edge to the sigma graph
  if (source == target) return; // don't add edge loops
  let name = source + '-' + target;
  if (SIGMA.graph.edges(name)) return; // don't add already existing edges
  SIGMA.graph.addEdge({
    id: name,
    source: source,
    target: target
  });
}

function collectGraph() {
  // Make a simple adjacency list object from the complex sigma graph
  // Also, sort everything alphabetically
  let graph = {};
  let nodes = SIGMA.graph.nodes().map(node=>node.id).sort();
  for (const node of nodes)
    graph[node] = new Set();
  for (const edge of SIGMA.graph.edges())
    graph[edge.source].add(edge.target);
  return graph;
}

// ** Functions for Taking User Input **

function drawGraphFromTextButton() {
  // Replace the current graph with the one described in the big text box on the webpage
  SIGMA.graph.clear();
  let graph = stringToGraph(document.getElementById('graphTextField').value);
  for (const source of Object.keys(graph)) {
    addNode(source);
    for (const target of graph[source]) {
      addNode(target);
      addEdge(source, target);
      addEdge(target, source);
    }
  }
  GRAPH = collectGraph(); // update the global graph object
  SIGMA.refresh(); // update the displayed picture
}

function stringToGraph(string) {
  let graph = {};
  for (let line of string.split('\n')) {
    line = line.replace(/ /g, ''); // remove spaces
    if (line == "") continue;
    let [source, targets] = line.split(':');
    if (targets == "")
      graph[source] = new Set();
    graph[source] = new Set(targets.split(','));
  }
  return graph;
}
    

function makePartitionFromTextButton() {
  // Set the partition to the one described by the user and color the coalitions
  // Also, sorts everything alphabetically
  let partition = stringToPartition(document.getElementById('partitionTextField').value);
  let nodes = SIGMA.graph.nodes().map(nodeO => nodeO.id);
  if (!isPartition(nodes, partition)) {
    window.alert("This is not a valid partition. Every node must occur on " +
      "exactly one line. (Commas seperate nodes.)");
    return;
  }
  PARTITION = partition;
  partition.forEach(coalition => colorSubgraph(coalition, randomColor()));
  SIGMA.refresh(); // update the displayed picture
}

function partitionToString(partition) {
  return Array.from(partition).map(coalition => Array.from(coalition).join(", ")).join("\n");
}

function stringToPartition(string) {
  let partition = new Set();
  for (let line of string.split('\n')) {
    line = line.replace(/ /g, ''); // remove spaces
    if (line == "") continue;
    partition.add(new Set(line.split(',')));
  }
  return partition;
}

function updatePartitionTextField() {
  document.getElementById("partitionTextField").innerHTML = partitionToString(PARTITION);
}


function isPartition(set, partition) {
  // checks if partition is actually a partition of the set
  let setCopy = new Set(set);
  for (const subSet of partition)
    for (const x of subSet)
      if (!setCopy.delete(x)) // an element occurs twice
        return false;
  if (setCopy.size > 0) // an element is missing
    return false;
  return true;
}

function colorSubgraph(nodes, color) {
  // color a subgraph induced by a set of nodes
  for (let nodeObject of SIGMA.graph.nodes(Array.from(nodes)))
    nodeObject.color = color;
}

function randomColor() {
  // generates a random hex color code
  return '#'+Math.random().toString(16).substr(-6);
}

// ** Buttons for Displaying Calculations **

function displayScoresButton() {
  // Displays every node's score of every coalition in the partition
  // TODO: do we want all nodes to evaluate all coalitions?
  // TODO: possibly switch to document.createElement
  let result = "<table>";
  result += "<tr><th></th>";
  for (const coalition of PARTITION)
    result += "<th>" + coalition.stringify() + "</th>";
  result += "</tr>";
  for (const node of Object.keys(GRAPH)) {
    result += "<tr> <th>" + node + "</th>"; // start a new row
    for (const coalition of PARTITION) {
      let score = SCOREFUNC(GRAPH, node, coalition.plus(node));
      result += "<td>" + ((score%1==0)? score : score.toFixed(2)) + "</td>"; // add a score
    }
    result += "</tr>";
  }
  result += "</table>";
  document.getElementById("scoreParagraph").innerHTML = result;
}

function setPlayerTypeButton() {
  // Set the global player type
  let nameToFunc = {"EQ": FOEQScore, "AL":FOALScore, "SF":FOSFScore, "simple":FOScore};
  let selection = document.getElementById("playerTypePicker").value;
  SCOREFUNC = nameToFunc[selection];
}

function individuallyRationalButton() {
  let [isIR, node] = isIndividuallyRational(GRAPH, PARTITION);
  let result = "";
  if (isIR)
    result += "Yes this partition is individually rational!";
  else {
    result += "No. Node '" + node + "' would rather be alone.";
  }
  document.getElementById("individuallyRationalParagraph").innerHTML = result;
  //document.getElementById("individuallyRationalParagraph").appendChild(makeMoveButton(new Set([node])));
}

function nashStableButton() {
  let [isNS, node, coalition] = isNashStable(GRAPH, PARTITION, SCOREFUNC);
  let result = "";
  if (isNS)
    result += "Yes, this partition is Nash stable.";
  else {
    result += "No, node '" + node + "' would rather be in coalition " +
      coalition.stringify() + ".";
  }
  document.getElementById("nashStableParagraph").innerHTML = result;
  //document.getElementById("nashStableParagraph").appendChild(makeMoveButton(coalition));
}

function individuallyStableButton() {
  let [isIS, node, coalition] = isIndividuallyStable(GRAPH, PARTITION, SCOREFUNC);
  let result = ""
  if (isIS)
    result += "Yes, this partition is individually stable";
  else {
    result = "No, node '" + node + "' would rather be in coalition " + coalition.stringify() +
      " and everyone in that coalition is okay with adding that node.";
  }
  document.getElementById("individuallyStableParagraph").innerHTML = result;
  //document.getElementById("individuallyStableParagraph").appendChild(makeMoveButton(coalition));
}

function contractuallyIndividuallyStableButton() {
  let [isCIS, node, coalition] = isContractuallyIndividuallyStable(GRAPH, PARTITION, SCOREFUNC);
  let result = ""
  if (isCIS)
    result += "Yes, this partition is contractually individually stable";
  else {
    result = "No, node '" + node + "' would rather be in coalition " + coalition.stringify() +
      " and everyone in that coalition is okay with adding that node" +
      " and everyone in that node's home coalition is okay with it leaving.";
  }
  document.getElementById("contractuallyIndividuallyStableParagraph").innerHTML = result;
  //document.getElementById("contractuallyIndividuallyStableParagraph").appendChild(makeMoveButton(coalition));
}

function strictlyPopularButton() {
  let [isSP, partition, winCount] = isStrictlyPopular(GRAPH, PARTITION, SCOREFUNC);
  let result = "";
  if (isSP)
    result += "Yes, this partition is Strictly Popular.";
  else {
    result += "No, partition {" + Array.from(partition).map(coalition=>coalition.stringify()).join(',') + "} is preferred overall by " + (-winCount) + " votes.";
    // TODO: add a button here
  }
  document.getElementById("strictlyPopularParagraph").innerHTML = result;
}

function coreStableButton() {
  let [isCS, coalition] = isCoreStable(GRAPH, PARTITION, SCOREFUNC);
  let result = "";
  if (isCS)
    result += "Yes, this partition is core stable";
  else {
    result += "No, the coalition " + coalition.stringify() + " is weakly blocking (all members weakly prefer it and one member strongly prefers it.).";
  }
  document.getElementById("coreStableParagraph").innerHTML = result;
  //document.getElementById("coreStableParagraph").appendChild(makeMoveButton(coalition));
}

function perfectButton() {
  // check if the partition is perfect and display result
  let [isP, node, coalition] = isPerfect(GRAPH, PARTITION, SCOREFUNC);
  let result = "";
  if (isP)
    result += "Yes, this is the perfect partition.";
  else {
    result += "No, node '" + node + "' would rather be in coalition " + coalition.stringify() + ".<br/>";
  }
  document.getElementById("perfectParagraph").innerHTML = result;
  //document.getElementById("perfectParagraph").appendChild(makeMoveButton(coalition));
}

function movePlayers(coalition) {
  PARTITION = adjustPartition(PARTITION, coalition);
  document.getElementById("partitionTextField").innerHTML = partitionToString(PARTITION);
  PARTITION.forEach(coalition => colorSubgraph(coalition, randomColor()));
  SIGMA.refresh();
}

function makeMoveButton(coalition) {
  // Broken!! TODO.
  let button = document.createElement("button");
  button.type = "button";
  console.log("Making a button for coalition " + coalition.stringify() + ".");
  button.onclick = function() {movePlayers(coalition);};
  button.innerText = "Move!";
  return button;
}
