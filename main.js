// ** general functions **
function randomSelect(array) {
  return array[Math.floor(Math.random() * array.length)];
}

// ** specific for graph stuff **

var s = new sigma('innergraphbox');
var creatingCoalition = false;
var modifyingCoalition = false;
var coalitions = { };
var coalitionName = "";

function addRandomNode(name="none") {
  // add a random node to the graph
  if (name == "none")
    name = 'n' + s.graph.nodes().length.toString();
  s.graph.addNode({
    id: name,
    label: name,
    x: Math.random(),
    y: Math.random(),
    size: 1,
    color: '#F00'
  });
  s.refresh();
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
}


function addRandomEdge() {
  // add a random edge to the graph
  // note: this does not guarantee that the edge is new
  var nodes = s.graph.nodes().map(function(nodeObject) {return nodeObject.id});
  var source = randomSelect(nodes);
  var target = randomSelect(nodes);
  while (source == target) {
    target = randomSelect(nodes);
  }
  s.graph.addEdge({
    id: 'edge' + source + '-' + target,
    source: source,
    target: target
  });
  s.refresh();
}

function addEdge() {
  // add an edge to the graph using the fields specified on the webpage
  var source = document.getElementById('edgeSource').value;
  var target = document.getElementById('edgeTarget').value;
  s.graph.addEdge({
    id: 'edge' + source + '-' + target,
    source: source,
    target: target,
  });
  s.refresh();
}

function addList() {
  // replace the current graph with the one described in the big text box on the webpage
  s.graph.clear();
  var bigString = document.getElementById('bigString').value;
  var lines = bigString.split('\n');
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i].replace(/ /g, '');
    var split1 = line.split(':');
    var source = split1[0];
    if (!s.graph.nodes(source))
      addRandomNode(source);
    var targets = split1[1].split(',');
    for (var j = 0; j < targets.length; j++) {
      var target = targets[j];
      if (!s.graph.nodes(target))
        addRandomNode(target);
      s.graph.addEdge({
        id: 'edge' + source + '-' + target,
        source: source,
        target: target
      });
    }
  }
  s.refresh();
}

function readJSON() {
  // replaces whatever is on the graph with the contents of a JSON file
  fileName = document.getElementById("getFile").files[0].name;
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

// Functions for the coalition creation interface

function updateCoalitionInterface()
{
    if (creatingCoalition || modifyingCoalition)
    {
        // Modify the HTML
        if (creatingCoalition)
        {
            document.getElementById("createNewCoalition").innerHTML = "Add nodes to coaltion";
            document.getElementById("modifyExistingCoalition").disabled = true;
        }
        else
        {
            document.getElementById("modifyExistingCoalition").innerHTML = "Add nodes to coaltion";
            document.getElementById("createNewCoalition").disabled = true;
        }
        document.getElementById("coalitionNodeListHeader").innerHTML = "Current nodes in coalition";

        // Create the list of coalition nodes
        var nodeHTML = "";
        for (i = 0; i < coalitions[coalitionName].length; i++)
        {
            nodeHTML += "<li>"+coalitions[coalitionName][i]+"<button class=\"btn\" onClick=\"removeCoalitionNode('" + coalitions[coalitionName][i] + "')\">X</button></li>";
        }
        document.getElementById("coalitionNodeList").innerHTML = nodeHTML;
    }
    else
    {
        // Modify the HTML
        document.getElementById("createNewCoalition").innerHTML = "Create new coalition";
        document.getElementById("modifyExistingCoalition").innerHTML = "Modify Existing Coalition";
        document.getElementById("coalitionNodeListHeader").innerHTML = "";
        document.getElementById("coalitionNodeList").innerHTML = "";

        // If the working coalition has no nodes, go ahead and delete it
        if (coalitionName != "")
        {
            if (coalitions[coalitionName].length == 0)
            {
                delete coalitions[coalitionName];
            }
        }

        // Update the list of coalitions
        var coalitionHTML = "";
        for (i = 0; i < Object.keys(coalitions).length; i++)
        {
            var coalName = Object.keys(coalitions)[i];
            coalitionHTML += "<option value=\"" + coalName + "\">"+coalName+"</option>";
        }
        document.getElementById("coalitionList").innerHTML = coalitionHTML;
        document.getElementById("createNewCoalition").disabled = false;
        document.getElementById("modifyExistingCoalition").disabled = false;
    }
}

function modifyCreateCoalitionState()
{
    if (!modifyingCoalition)
    {
        if (!creatingCoalition)
        {
            coalitionName = document.getElementById("coalitionName").value;
            if (Object.keys(coalitions).indexOf(coalitionName) != -1)
            {
                alert("Coalition "+coalitionName+" already exists!");
            }
            else
            {
                coalitions[coalitionName] = [ ];
                creatingCoalition = true;
            }
        }
        else
        {
            creatingCoalition = false;
            document.getElementById("modifyExistingCoalition").disabled = false;
        }
        updateCoalitionInterface();
    }
}

function modifyExistingCoalition()
{
    if (!creatingCoalition)
    {
        if (!modifyingCoalition)
        {
            coalitionName = document.getElementById("coalitionList").value;
            modifyingCoalition = true;
            document.getElementById("createNewCoalition").disabled = true;
        }
        else
        {
            modifyingCoalition = false;
            document.getElementById("createNewCoalition").disabled = false;
        }
        updateCoalitionInterface();
    }
}

// Handlers for events when the user interacts with the graph

// Handler for clicking a node
function clickNodeHandler(event)
{
    if (creatingCoalition || modifyingCoalition)
    {
        var nodeId = event.data.node.id;
        if (coalitions[coalitionName].indexOf(nodeId) != -1)
        {
            alert("The node " + nodeId + " is already in the coalition!");
        }
        else
        {
            // Check whether the node is already in another coalition
            var inCoalition = false;
            var coalitionMembership = "";
            for (var key in coalitions)
            {
                if (coalitions[key].indexOf(nodeId) != -1)
                {
                    inCoalition = true;
                    coalitionMembership = key;
                }
            }
            if (inCoalition)
            {
                alert("The node " + nodeId + " is already in coalition " + coalitionMembership + "!");
            }
            else
            {
                coalitions[coalitionName].push(nodeId);
                updateCoalitionInterface();
            }
        }
    }
}

function removeCoalitionNode(nodeId)
{
    var nodeIndex = coalitions[coalitionName].indexOf(nodeId);
    coalitions[coalitionName].splice(nodeIndex, 1);
    updateCoalitionInterface();
}

// Code to initialize the page
s.bind("clickNode", clickNodeHandler);
updateCoalitionInterface();
