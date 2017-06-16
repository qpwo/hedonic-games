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

document.getElementById("graphText").innerHTML = "a: b, c, d\nc: d, e"; // default value
document.getElementById("drawGraph").onclick = function() {
  // Replace the current graph with the one described in the big text box on the webpage
  SIGMA.graph.clear();
  let graph = stringToGraph(document.getElementById('graphText').value);
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
  document.getElementById("stabilityResults").style.backgroundColor = "lightgrey";
  document.getElementById("scores").style.backgroundColor = "lightgrey";
  PARTITION = null;
}
document.getElementById("drawGraph").click()

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

document.getElementById("partitionText").innerHTML = "a, b\nc, d\ne"; // default value
document.getElementById("colorPartition").onclick = function() {
  // Set the partition to the one described by the user and color the coalitions
  // Also, sorts everything alphabetically
  let partition = stringToPartition(document.getElementById('partitionText').value);
  let nodes = SIGMA.graph.nodes().map(nodeO => nodeO.id);
  if (!isPartition(nodes, partition)) {
    window.alert("This is not a valid partition. Every node must occur on " +
      "exactly one line. (Commas seperate nodes.)");
    return;
  }
  PARTITION = partition;
  partition.forEach(coalition => colorSubgraph(coalition, randomColor()));
  SIGMA.refresh(); // update the displayed picture
  document.getElementById("stabilityResults").style.backgroundColor = "lightgrey";
  document.getElementById("scores").style.backgroundColor = "lightgrey";
}
document.getElementById("colorPartition").click()

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
  // TODO: make colors more different from each other
  return '#'+Math.random().toString(16).substr(-6);
}

function changePartition(partition) {
  document.getElementById("partitionText").innerHTML = partitionToString(partition);
  partition.forEach(coalition => colorSubgraph(coalition, randomColor()));
  PARTITION = partition;
  SIGMA.refresh();
}

// ** Buttons for Displaying Calculations **

{
  // TODO eventually: add fractional games
  let functions = [FOScore, EOScore, FOSFScore, FOEQScore, FOALScore];
  let paragraphIds = ["friendOriented", "enemyOriented", "selfishFirst", "equalTreatment", "altruisticTreatment"];
  let changePlayerType = function() {
    let choice = document.getElementById("playerType").selectedIndex;
    SCOREFUNC = functions[choice];
    for (let i=0; i<paragraphIds.length; i++)
      document.getElementById(paragraphIds[i]).style.display = "none";
    document.getElementById(paragraphIds[choice]).style.display = "initial";
    document.getElementById("stabilityResults").style.backgroundColor = "lightgrey";
    document.getElementById("scores").style.backgroundColor = "lightgrey";
  }
  document.getElementById("playerType").onchange = changePlayerType
  changePlayerType()
}


{
  let functions = [checkIndividuallyRational, checkNashStable,
    checkIndividuallyStable, checkContractuallyIndividuallyStable,
    checkStrictlyPopular, checkCoreStable, checkPerfect]
  let paragraphIds = ["individuallyRational", "nashStable",
    "individuallyStable", "contractuallyIndividuallyStable", "strictlyPopular",
    "coreStable", "perfect",]
  let changeStabilityType = function() {
    // Executes when user picks a different stability type
    let choice = document.getElementById("stabilityType").selectedIndex;

    // set up the stability button
    let stabilityFunc = functions[choice];
    let buttonAction = function() {
      if (PARTITION == null) {
        window.alert("You must set a partition before you can check its stability.")
        return;
      }
      let [string, partition] = stabilityFunc()
      let results = document.getElementById("stabilityResults");
      results.innerHTML = string;
      results.style.backgroundColor = null;
      let button = document.getElementById("updatePartition");
      if (partition) {
        button.style.display = "initial";
        button.onclick = function() {
          changePartition(partition);
          document.getElementById("stabilityResults").style.backgroundColor = "lightgrey";
        };
      }
      else {
        button.style.display = "none";
      }
    }
    document.getElementById("checkStability").onclick = buttonAction;
    buttonAction();

    // update the stability explanation
    for (let i=0; i<paragraphIds.length; i++) // first hide all the paragraphs
      document.getElementById(paragraphIds[i]).style.display = "none";
    document.getElementById(paragraphIds[choice]).style.display = "initial"; // then display the one we want
  }
  document.getElementById("stabilityType").onchange = changeStabilityType;
  changeStabilityType();
}

document.getElementById("computeScores").onclick = function() {
  // Displays every node's score of every coalition in the partition
  // TODO: do we want all nodes to evaluate all coalitions?
  // TODO: possibly switch to document.createElement
  if (PARTITION == null) {
    window.alert("You must set a partition before you can compute the scores.")
    return;
  }
  let result = "<table>";
  result += "<tr><th></th>";
  let coalitions = PARTITION.plus(new Set());
  for (const coalition of coalitions)
    result += "<th>" + coalition.stringify() + "</th>";
  result += "</tr>";
  for (const node of Object.keys(GRAPH)) {
    result += "<tr> <th>" + node + "</th>"; // start a new row
    for (const coalition of coalitions) {
      let score = SCOREFUNC(GRAPH, node, coalition.plus(node));
      result += "<td>" + ((score%1==0)? score : score.toFixed(2)) + "</td>"; // add a score
    }
    result += "</tr>";
  }
  result += "</table>";
  let scores = document.getElementById("scores");
  scores.innerHTML = result;
  scores.style.backgroundColor = null;
}

// ** Stability Checks **

function checkIndividuallyRational() {
  let [isIR, node] = isIndividuallyRational(GRAPH, PARTITION, SCOREFUNC);
  if (isIR)
    return ["Yes.", null];
  return ["No. Counterexample: node " + node, groupElope(PARTITION, new Set([node]))];
}

function checkNashStable() {
  let [isNS, node, coalition] = isNashStable(GRAPH, PARTITION, SCOREFUNC);
  if (isNS)
    return ["Yes.", null];
  return ["No. Counterexample: node " + node + " and coalition " + coalition.stringify(),
    groupElope(PARTITION, coalition.plus(node))];
}

function checkIndividuallyStable() {
  let [isIS, node, coalition] = isIndividuallyStable(GRAPH, PARTITION, SCOREFUNC);
  if (isIS)
    return ["Yes.", null];
  return ["No. Counterexample: node " + node + " and coalition " + coalition.stringify(),
    groupElope(PARTITION, coalition.plus(node))];
}

function checkContractuallyIndividuallyStable() {
  let [isCIS, node, coalition] = isContractuallyIndividuallyStable(GRAPH, PARTITION, SCOREFUNC);
  if (isCIS)
    return ["Yes.", null];
  return ["No. Counterexample: node " + node + " and coalition " + coalition.stringify(),
    groupElope(PARTITION, coalition.plus(node))];
}

function checkStrictlyPopular() {
  // TODO: separate into for, against, and tie votes.
  let [isSP, partition, winCount] = isStrictlyPopular(GRAPH, PARTITION, SCOREFUNC);
  if (isSP)
    return ["Yes.", null]
  let partitionString = '{' + Array.from(partition).map(coalition=>coalition.stringify()).join(',') + '}';
  let string = "";
  if (winCount == 0)
    string = "No. Counterexample: partition " + partitionString + " is equally preferred to the current partition.";
  else
    string ="No. Counterexample: partition " + partitionString + " is preferred overall by " + (-winCount) + " votes." 
  return [string, partition];
}

function checkCoreStable() {
  let [isCS, coalition] = isCoreStable(GRAPH, PARTITION, SCOREFUNC);
  if (isCS)
    return ["Yes.", null]
  return ["No. Counterexample: coalition " + coalition.stringify(),
    groupElope(PARTITION, coalition)];
}

function checkPerfect() {
  // check if the partition is perfect and display result
  let [isP, node, coalition] = isPerfect(GRAPH, PARTITION, SCOREFUNC);
  if (isP)
    return ["Yes.", null];
  return ["No. Counterexample: node " + node + " and coalition " + coalition.stringify(),
    groupElope(PARTITION, coalition.plus(node))];
}
