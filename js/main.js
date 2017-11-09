// Luke Miles, November 2017
// Code for all the buttons and things on the front webpage

// TODO: switch from graph type to value matrix type for all score functions
// TODO: switch from handling strings to handling integers in all score functions and all everything

// ** Necessary globals for setting up a user session **

let PARTITION; // current partition of the vertices, an array of sets
let SCOREFUNC; // function to use for player type

let NETWORK = new vis.Network(document.getElementById("visjsbox"), {}, {});
let WIDTH;

// ** testing bed **

function drawMatrix() {
  const width = parseInt(document.getElementById("numberPlayers").value);
  let table = document.getElementById("matrix");
  while (table.hasChildNodes())
    table.removeChild(table.lastChild);
  for (let i=0; i<width; i++) {
    let row = table.insertRow();
    for (let j=0; j<width; j++) {
      let cell = row.insertCell();
      let input = document.createElement("input");
      input.size = 2;
      cell.appendChild(input);
    }
  }
}

// ** Functions for Taking User Input **

// For drawing the graph:

function drawGraph() {
  let table = document.getElementById("matrix");
  let width = table.rows.length;
  let nodes = Array(width).fill().map((_,i) => {return {id: i, label: i.toString()}});
  let edges = [];
  for (let row=0; row<width; row++) {
    for (let col=0; col<width; col++) {
      const cell = table.rows[row].cells[col];
      const input = cell.lastChild;
      const string = input.value;
      if (string == "") continue;
      const value = parseInt(string);
      edges.push({from: row, to: col, arrows: 'to', label: value.toString()});
    }
  }
  DATA = {nodes: nodes, edges: edges};
  NETWORK.setData(DATA);
}

// For making the partition:
document.getElementById("partitionText").value = "SteveHolt, Maeybe, George\nLindsay, Tobias, Lucille\nMichael" // default value

document.getElementById("colorPartition").onclick = function() {
  // Set the partition to the one described by the user and color the coalitions
  let stringPartition = stringToPartition(document.getElementById("partitionText").value);
  let ids = DATA.nodes.map(node => node.id);
  if (!isPartition(ids, numberPartition)) {
    //window.alert("This is not a valid partition. Every node must occur on exactly one line. (Commas seperate nodes.)");
    return;
  }
  PARTITION = stringPartition;
  colorGraph();
  greyOut();
};
document.getElementById("colorPartition").click()

function partitionToString(partition) {
  // Turn the array of sets into a long string to put in the text box
  return partition.map(coalition => Array.from(coalition).join(", ")).join("\n");
}
function partitionToLine(partition) {
  // Turn the array of sets into a short string for reading
  return "{{" + partition.map(coalition => Array.from(coalition).join(", ")).join("}, {") + "}}";
}

function stringToPartition(string) {
  // Convert the partition text box to an array of sets
  let partition = [];
  for (let line of string.split('\n')) {
    line = line.replace(/ /g, '');
    if (line == "") continue;
    partition.push(line.split(',').map(string => parseInt(string)));
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
  // Change the text box, the displayed partition, and the global partition
  document.getElementById("partitionText").value = partitionToString(partition);
  PARTITION = partition;
  colorGraph();
  greyOut();
}

function greyOut() {
  // Mark obsolete information with a grey background
  document.getElementById("stabilityResults").style.backgroundColor = "lightgrey";
  document.getElementById("scores").style.backgroundColor = "lightgrey";
}

// ** Buttons for Displaying Calculations **

{
  let functions = [sum, mean, median, max, min, friendOriented, enemyOriented];
  document.getElementById("playerType").onchange = function() {
    let choice = document.getElementById("playerType").selectedIndex;
    SCOREFUNC = functions[choice];
    greyOut();
  };
  document.getElementById("playerType").onchange();
}


{
  let isFunctions = [isIndividuallyRational, isNashStable, isIndividuallyStable, isContractuallyIndividuallyStable, isPopular, isStrictlyPopular, isCoreStable, isStrictlyCoreStable, isPerfect];

  document.getElementById("stabilityType").onchange = function() {
    let index = document.getElementById("stabilityType").selectedIndex;

    document.getElementById("checkStability").onclick = function() {
      let results = document.getElementById("stabilityResults");
      results.style.backgroundColor = null;
      if (PARTITION == null) {
        //window.alert("You must set a partition before you can check its stability.");
        return;
      }
      let [isStable, counterExample, newPartition] = isFunctions[index](GRAPH, PARTITION, SCOREFUNC);
      let button = document.getElementById("updatePartition");
      if (isStable) {
        results.innerText = "This partition is stable.";
        button.style.display = "none";
      } else {
        results.innerText = "Counterexample:" + JSON.stringify(counterExample);
        button.style.display = null;
        button.onclick = function(){changePartition(newPartition)};
      }
    }
    document.getElementById("checkStability").click()

    document.getElementById("checkStabilityExistence").onclick = function() {
      let results = document.getElementById("stabilityResults");
      results.style.backgroundColor = null;
      let button = document.getElementById("updatePartition");
      if (PARTITION && isFunctions[index](GRAPH, PARTITION, SCOREFUNC)[0]) {
        results.innerText = "This partition is stable (and therefore satisfies existence).";
        button.style.display = "none";
        return;
      }
      let [exists, example] = checkExistence(GRAPH, SCOREFUNC, isFunctions[index]);
      if (exists) {
        results.innerText = "Stable partition:" + partitionToLine(example);
        button.style.display = null;
        button.onclick = function(){changePartition(example);};
        return;
      }
      results.innerText = "No stable partition exists."
      button.style.display = "none";
    };
  }
}
document.getElementById("stabilityType").onchange();

document.getElementById("computeScores").onclick = function() {
  // Display every node's score of every coalition in the partition
  // possible TODO: switch to document.createElement
  if (PARTITION == null) {
    //window.alert("You must set a partition before you can compute the scores.")
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
};

// ** Coloring tools **

function colorGraph() {
  // Colors the entire graph
  let length = PARTITION.length;
  for (let i=0; i<length; i++) {
    let color = rainbow(length, i);
    let coalition = PARTITION[i];
    for (let node of DATA.nodes)
      if (coalition.has(node.label)) {
        node.color = color;
      }
  }
  NETWORK.setData(DATA);
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
