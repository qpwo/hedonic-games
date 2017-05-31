// Luke Miles, April 2017
// Code for all the buttons and things on lukexmiles.com/hedonic-games

// TODO: rename global letiables to all-caps things

// ** necessary globals for setting up a user session **

let SIGMA = new sigma("innergraphbox"); // the thing controlling/displaying the graph
sigma.plugins.dragNodes(SIGMA, SIGMA.renderers[0]); // enable click and drag
SIGMA.settings('zoomingRatio', 1); // scroll doesn't zoom
let PARTITION = []; // current partition of the vertices
let GRAPH = {}; // a map from nodes to arrays of nodes
let SCOREFUNC = FOScore; // function to use for player type

// ** Functions for Reading and Changing the Graph **

function addNode(name, x=Math.random(), y=Math.random()) {
  // add a node to the graph
  name = (name ? name : 'n' + SIGMA.graph.nodes().length.toString());
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
  // add an edge to the graph
  if (source == target) return; // don't add edge loops
  name = source + '-' + target;
  if (SIGMA.graph.edges(name)) return; // don't add already existing edges
  SIGMA.graph.addEdge({
    id: name,
    source: source,
    target: target
  });
}

function collectGraph() {
  // Make a simple adjacency list object from the complex nodejs graph.
  // Also, it sorts everything alphabetically.
  let graph = {};
  let nodes = SIGMA.graph.nodes().map(node=>node.id).sort();
  for (const node of nodes)
    graph[node] = [];
  for (const edge of SIGMA.graph.edges())
    graph[edge.source].push(edge.target);
  for (const node of nodes)
    graph[node].sort();
  return graph;
}

// ** Functions for Taking User Input **

function drawGraphFromTextButton() {
  // Replace the current graph with the one described in the big text box on the webpage.
  // TODO: handle empty lines
  SIGMA.graph.clear();
  let bigString = document.getElementById('graphTextField').value;
  let lines = bigString.split('\n');
  for (const line of lines) {
    let colonSplit = line.replace(/ /g, '').split(':');
    let source = colonSplit[0];
    let targets = colonSplit[1].split(',');
    addNode(source);
    for (let target of targets) {
      if (!target) continue; // empty target list
      addNode(target);
      addEdge(source, target);
      addEdge(target, source);
    }
  }
  GRAPH = collectGraph(); // update the global graph object
  SIGMA.refresh(); // update the displayed picture
}

function stringToPartition(string) {
  let partition = [];
  for (let line of string.split('\n')) {
    line = line.replace(/ /g, ''); // remove spaces
    if (line == "") continue;
    partition.push(line.split(','));
  }
  return partition;
}
    

function makePartitionFromTextButton() {
  // Set the partition to the one described by the user and color the coalitions.
  // Also, it sorts everything alphabetically.
  let partition = stringToPartition(document.getElementById('partitionTextField').value);
  let nodes = SIGMA.graph.nodes().map(nodeO => nodeO.id);
  if (!isPartition(nodes, partition)) {
    window.alert("This is not a valid partition. Every node must occur on " +
      "exactly one line. (Commas seperate nodes.)");
    return;
  }
  PARTITION = partition.map(arr => arr.sort()).sort(
    (arr1, arr2) => JSON.stringify(arr1).localeCompare(JSON.stringify(arr2)));
  PARTITION.forEach(coalition => colorSubgraph(coalition, randomColor()));
  SIGMA.refresh(); // update the displayed picture
}

function partitionToString(partition) {
  let result = "";
  for (const coalition of partition) {
    for (const node of coalition)
      result += node + ' ';
    result += '\n';
  }
  return result;
}

function updatePartitionTextField() {
  document.getElementById("partitionTextField").innerHTML = partitionToString(PARTITION);
}


function isPartition(arr, arrArr) {
  // checks if the arrArr is a partition of the arr
  let concatified = [].concat.apply([],arrArr);
  return (concatified.length == arr.length) && arr.every(x => concatified.includes(x));
}

function colorSubgraph(nodes, color) {
  // color a subgraph induced by a set of nodes
  for (let nodeObject of SIGMA.graph.nodes(nodes))
    nodeObject.color = color;
}

function randomColor() {
  // generates a random hex color code
  return '#'+Math.random().toString(16).substr(-6);
}

// ** Buttons for Displaying Calculations **

function displayScoresButton() {
  // Displays every node's score of every coalition in the partition.
  result = "<table>";
  result += "<tr><th></th>";
  for (const coalition of PARTITION)
    result += "<th>" + coalition.toString() + "</th>";
  result += "</tr>";
  for (const node of Object.keys(GRAPH)) {
    result += "<tr> <th>" + node + "</th>"; // start a new row
    for (const coalition of PARTITION) {
      let score = SCOREFUNC(GRAPH, node, coalition); 
      result += "<td>" + ((score%1==0)? score : score.toFixed(2)) + "</td>"; // add a score
    }
    result += "</tr>";
  }
  result += "</table>";
  document.getElementById("scoreParagraph").innerHTML = result;
}

function setPlayerTypeButton() {
  // Set the global player type.
  let nameToFunc = {"EQ": FOEQScore, "AL":FOALScore, "SF":FOSFScore, "simple":FOScore};
  let selection = document.getElementById("playerTypePicker").value;
  SCOREFUNC = nameToFunc[selection];
}

function individuallyRationalButton() {
  let [isIR, node] = isIndividuallyRational(GRAPH, PARTITION);
  let result = "";
  if (isIR)
    result += "Yes this partition is individually rational!";
  else
    result += "No. Node '" + node + "' would rather be alone.";
  document.getElementById("individuallyRationalParagraph").innerHTML = result;
}

function nashStableButton() {
  let [isNS, node, coalition] = isNashStable(GRAPH, PARTITION, SCOREFUNC);
  let result = "";
  if (isNS)
    result += "Yes, this partition is Nash stable.";
  else
    result += "No, node '" + node + "' would rather be in coalition [" + coalition + "].";
  document.getElementById("nashStableParagraph").innerHTML = result;
}

function individuallyStableButton() {
  let [isIS, node, coalition] = isIndividuallyStable(GRAPH, PARTITION, SCOREFUNC);
  let result = ""
  if (isIS)
    result += "Yes, this partition is individually stable";
  else
    result = "No, node '" + node + "' would rather be in coalition [" + coalition +
      "] and everyone in that coalition is okay with adding that node.";
  document.getElementById("individuallyStableParagraph").innerHTML = result;
}

function contractuallyIndividuallyStableButton() {
  let [isCIS, node, coalition] = isContractuallyIndividuallyStable(GRAPH, PARTITION, SCOREFUNC);
  let result = ""
  if (isCIS)
    result += "Yes, this partition is contractually individually stable";
  else
    result = "No, node '" + node + "' would rather be in coalition [" + coalition +
      "] and everyone in that coalition is okay with adding that node" +
      " and everyone in that node's home coalition is okay with it leaving.";
  document.getElementById("contractuallyIndividuallyStableParagraph").innerHTML = result;
}

function strictlyPopularButton() {
  let [isSP, betterPartition, winCount] = isStrictlyPopular(GRAPH, PARTITION, SCOREFUNC);
  let result = "";
  if (isSP)
    result += "Yes, this partition is Strictly Popular.";
  else
    result += "No, partition " + JSON.stringify(betterPartition) + " is preferred overall by " + (-winCount) + " votes.";
  document.getElementById("strictlyPopularParagraph").innerHTML = result;
}

function coreStableButton() {
  let [isCS, coalition] = isCoreStable(GRAPH, PARTITION, SCOREFUNC);
  let result = "";
  if (isCS)
    result += "Yes, this partition is core stable";
  else
    result += "No, the coalition [" + coalition + "] wants to elope.";
  document.getElementById("coreStableParagraph").innerHTML = result;
}

function perfectButton() {
  // check if the partition is perfect and display result
  let [isP, node, otherCoalition] = isPerfect(GRAPH, PARTITION, SCOREFUNC);
  let result = "";
  if (isP)
    result += "Yes, this is the perfect partition.";
  else {
    result += "No, node '" + node + "' would rather be in coalition [" + otherCoalition + "].";
  }
  document.getElementById("perfectParagraph").innerHTML = result;
}

function movePlayers(coalition) {
  // TODO: actually implement this. Just a sketch right now.
  // 1. change global partition
  // 2. color the graph
  // 3. change the text inside the partition textfield
  PARTITION = adjustPlayers(partition, coalition);
  return 0;
}
