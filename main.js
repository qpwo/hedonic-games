// Luke Miles, June 2017
// Code for all the buttons and things on the front webpage

// ** Necessary globals for setting up a user session **

let SIGMA = new sigma("innergraphbox"); // the thing controlling/displaying the graph
sigma.plugins.dragNodes(SIGMA, SIGMA.renderers[0]); // enable click and drag
SIGMA.settings({"zoomingRatio": 1, // scroll doesn't zoom
  "edgeColor": "#000#"}); // edges are all black

let PARTITION; // current partition of the vertices, an array of sets
let GRAPH; // a map from nodes to arrays of nodes
let SCOREFUNC; // function to use for player type

// ** Functions for Reading and Changing the Graph **

function addNode(name=Sigma.graph.nodes().length, x=Math.random(), y=Math.random()) {
  // Add a node to the sigma graph
  if (SIGMA.graph.nodes(name)) return;
  SIGMA.graph.addNode({
    id: name,
    label: name,
    x: x,
    y: y,
    size: 1,
    color: "#000"
  });
  SIGMA.refresh();
}

function addEdge(source, target) {
  // Add an edge to the sigma graph
  if (source == target) return;
  let name = source + '-' + target;
  if (SIGMA.graph.edges(name)) return;
  SIGMA.graph.addEdge({
    id: name,
    source: source,
    target: target
  });
}

function collectGraph() {
  // Make a simple adjacency list object from the complex sigma graph
  let graph = {};
  let nodes = SIGMA.graph.nodes().map(node=>node.id).sort();
  for (const node of nodes)
    graph[node] = new Set();
  for (const edge of SIGMA.graph.edges())
    graph[edge.source].add(edge.target);
  return graph;
}

// ** Functions for Taking User Input **

// For drawing the graph:
document.getElementById("graphText").innerHTML = "GeorgeMichael: Maeybe, Michael\nLindsay: Tobias, Maeybe\nSteveHolt: Maeybe\nLucille: Lindsay, GeorgeMichael"; // default value
document.getElementById("drawGraph").onclick = function() {
  SIGMA.graph.clear();
  let graph = stringToGraph(document.getElementById("graphText").value);
  for (const source of Object.keys(graph)) {
    addNode(source);
    for (const target of graph[source]) {
      addNode(target);
      addEdge(source, target);
      addEdge(target, source);
    }
  }
  GRAPH = collectGraph();
  SIGMA.refresh();
  document.getElementById("stabilityResults").style.backgroundColor = "lightgrey";
  document.getElementById("scores").style.backgroundColor = "lightgrey";
  PARTITION = null;
}
document.getElementById("drawGraph").click()

function stringToGraph(string) {
  let graph = {};
  for (let line of string.split('\n')) {
    line = line.replace(/ /g, '');
    if (line == "") continue;
    if (line.indexOf(':') == -1) {
      graph[line] = new Set();
      continue;
    }
    let [source, targets] = line.split(':');
    if (targets == "") {
      graph[source] = new Set();
      continue;
    }
    graph[source] = new Set(targets.split(','));
  }
  return graph;
}

// For making the partition:
document.getElementById("partitionText").value = "SteveHolt, Maeybe, GeorgeMichael\nLindsay, Tobias, Lucille\nMichael" // default value

document.getElementById("colorPartition").onclick = function() {
  // Set the partition to the one described by the user and color the coalitions
  let partition = stringToPartition(document.getElementById("partitionText").value);
  let nodes = SIGMA.graph.nodes().map(nodeO => nodeO.id);
  if (!isPartition(nodes, partition)) {
    window.alert("This is not a valid partition. Every node must occur on " +
      "exactly one line. (Commas seperate nodes.)");
    return;
  }
  PARTITION = partition;
  colorGraph();
  SIGMA.refresh();
  document.getElementById("stabilityResults").style.backgroundColor = "lightgrey";
  document.getElementById("scores").style.backgroundColor = "lightgrey";
}
document.getElementById("colorPartition").click()

function partitionToString(partition) {
  return partition.map(coalition => Array.from(coalition).join(", ")).join("\n");
}

function stringToPartition(string) {
  let partition = [];
  for (let line of string.split('\n')) {
    line = line.replace(/ /g, '');
    if (line == "") continue;
    partition.push(new Set(line.split(',')));
  }
  return partition;
}

function isPartition(set, partition) {
  // Check if partition is actually a partition of the set
  let setCopy = new Set(set);
  for (const subSet of partition)
    for (const x of subSet)
      if (!setCopy.delete(x)) // an element occurs twice
        return false;
  if (setCopy.size > 0) // an element is missing
    return false;
  return true;
}


function changePartition(partition) {
  document.getElementById("partitionText").value = partitionToString(partition);
  PARTITION = partition;
  colorGraph();
  SIGMA.refresh();
}

// ** Buttons for Displaying Calculations **

{
  let functions = [FOScore, EOScore, FOSFScore, FOEQScore, FOALScore, fractionalScore, additiveScore];
  let paragraphIds = ["friendOriented", "enemyOriented", "selfishFirst", "equalTreatment", "altruisticTreatment", "fractional", "additive"];
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
    checkStrictlyPopular, checkCoreStable, checkStrictlyCoreStable, checkPerfect]
  let paragraphIds = ["individuallyRational", "nashStable",
    "individuallyStable", "contractuallyIndividuallyStable", "strictlyPopular",
    "coreStable", "strictlyCoreStable", "perfect",]
  let changeStabilityType = function() {
    let choice = document.getElementById("stabilityType").selectedIndex;

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

    for (let i=0; i<paragraphIds.length; i++)
      document.getElementById(paragraphIds[i]).style.display = "none";
    document.getElementById(paragraphIds[choice]).style.display = "initial";
  }
  document.getElementById("stabilityType").onchange = changeStabilityType;
  changeStabilityType();
}

document.getElementById("computeScores").onclick = function() {
  // Display every node's score of every coalition in the partition
  // possible TODO: switch to document.createElement
  if (PARTITION == null) {
    window.alert("You must set a partition before you can compute the scores.")
    return;
  }
  let result = "<table>";
  result += "<tr><th></th>";
  let coalitions = PARTITION.concat(new Set());
  for (const coalition of coalitions)
    result += "<th>" + coalition.stringify() + "</th>";
  result += "</tr>";
  for (const node of Object.keys(GRAPH)) {
    result += "<tr> <th>" + node + "</th>";
    for (const coalition of coalitions) {
      let score = SCOREFUNC(GRAPH, node, coalition.plus(node));
      result += "<td>" + ((score%1==0)? score : score.toFixed(2)) + "</td>";
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
  let partitionString = '{' + partition.map(coalition=>coalition.stringify()).join(',') + '}';
  let string = "";
  if (winCount == 0)
    string = "No. Counterexample: partition " + partitionString + " is equally preferred to the current partition.";
  else
    string = "No. Counterexample: partition " + partitionString + " is preferred overall by " + (-winCount) + " votes.";
  return [string, partition];
}

function checkCoreStable() {
  let [isCS, coalition] = isCoreStable(GRAPH, PARTITION, SCOREFUNC);
  if (isCS)
    return ["Yes.", null]
  return ["No. Counterexample: coalition " + coalition.stringify(),
    groupElope(PARTITION, coalition)];
}

function checkStrictlyCoreStable() {
  let [isCS, coalition] = isStrictlyCoreStable(GRAPH, PARTITION, SCOREFUNC);
  if (isCS)
    return ["Yes.", null]
  return ["No. Counterexample: coalition " + coalition.stringify(),
    groupElope(PARTITION, coalition)];
}

function checkPerfect() {
  let [isP, node, coalition] = isPerfect(GRAPH, PARTITION, SCOREFUNC);
  if (isP)
    return ["Yes.", null];
  return ["No. Counterexample: node " + node + " and coalition " + coalition.stringify(),
    groupElope(PARTITION, coalition.plus(node))];
}

// ** Coloring tools **

function colorGraph() {
  let length = PARTITION.length;
  PARTITION.forEach((coalition, index) => colorSubgraph(coalition, rainbow(length, index)));
}

function colorSubgraph(coalition, color) {
  // Color all the nodes in the coalition
  for (let nodeObject of SIGMA.graph.nodes(Array.from(coalition)))
    nodeObject.color = color;
}

function rainbow(numOfSteps, step) {
  // Generates vibrant, "evenly spaced" colours
  // From https://stackoverflow.com/a/7419630
  let r, g, b;
  let h = step / numOfSteps;
  let i = ~~(h * 6);
  let f = h * 6 - i;
  let q = 1 - f;
  switch(i % 6){
    case 0: r = 1; g = f; b = 0; break;
    case 1: r = q; g = 1; b = 0; break;
    case 2: r = 0; g = 1; b = f; break;
    case 3: r = 0; g = q; b = 1; break;
    case 4: r = f; g = 0; b = 1; break;
    case 5: r = 1; g = 0; b = q; break;
  }
  let c = "#" + ("00" + (~ ~(r * 255)).toString(16)).slice(-2) + ("00" + (~ ~(g * 255)).toString(16)).slice(-2) + ("00" + (~ ~(b * 255)).toString(16)).slice(-2);
  return (c);
}

// ** Other Stuff **

{
  let hideShow = function(buttonId, paragraphId) {
    let par = document.getElementById(paragraphId);
    let button = document.getElementById(buttonId);
    if (par.style.display == "none") {
      par.style.display = "initial";
      button.innerHTML = "[hide explanation]";
    } else {
      par.style.display = "none";
      button.innerHTML = "[show explanation]";
    }
  }

  document.getElementById("hideShowPlayerExplanation").onclick = (() => hideShow("hideShowPlayerExplanation", "playerExplanation"));
  document.getElementById("hideShowStabilityExplanation").onclick = (() => hideShow("hideShowStabilityExplanation", "stabilityExplanation"));
}
