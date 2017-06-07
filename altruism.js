// Luke Miles, June 2017
// Algorithms for altruistic hedonic games
// Public domain dedication

// TODO eventually: everything should be implemented with sets instead of arrays.

// TODO: change order of functions

// ** Score Functions **

// possible TODO: shorten code for similar score functions with scoping

function FOScore(graph, node, coalition) {
  // node's friend oriented score of coalition
  if (!coalition.has(node)) throw "coalition doesn't contain node";
  var n = Object.keys(graph).length;
  var numFriends = coalition.intersect(graph[node]).size;
  var numEnemies = coalition.size - numFriends - 1;
  return n * numFriends - numEnemies;
}

function EOScore(graph, node, coalition) {
  // node's friend oriented score of coalition
  if (!coalition.has(node)) throw "coalition doesn't contain node";
  var n = Object.keys(graph).length;
  var numFriends = coalition.intersect(graph[node]).size;
  var numEnemies = coalition.size - numFriends - 1;
  return numFriends - n * numEnemies;
}


function friendAverage(graph, node, coalition) {
  // the average happiness of a node's friends in a given coalition
  var total = 0;
  var count = 0;
  for (const friend of coalition.intersect(graph[node])) {
    total += FOScore(graph, friend, coalition);
    count++;
  }
  return (count>0 ? total/count : 0);
}

function FOSFScore(graph, node, coalition) {
  // node's selfish-first score of coalition
  if (!coalition.has(node)) throw "coalition doesn't contain node";
  var n = Object.keys(graph).length;
  var myScore = FOScore(graph, node, coalition);
  var friendsScore = friendAverage(graph, node, coalition);
  return Math.pow(n, 5) * myScore + friendsScore;
}

function FOALScore(graph, node, coalition) {
  // node's altruistic treatment score of coalition
  if (!coalition.has(node)) throw "coalition doesn't contain node";
  var n = Object.keys(graph).length;
  var myScore = FOScore(graph, node, coalition);
  var friendsScore = friendAverage(graph, node, coalition);
  return myScore + Math.pow(n, 5) * friendsScore;
}

function FOEQScore(graph, node, coalition) {
  // node's equal treatment score of coalition
  if (!coalition.has(node)) throw "coalition doesn't contain node";
  var n = Object.keys(graph).length;
  var total = FOScore(graph, node, coalition);
  var count = 1;
  for (const friend of coalition.intersect(graph[node])) {
    total += FOScore(graph, friend, coalition)
    count++;
  }
  return total/count;
}

// ** Stability Concepts **

function isIndividuallyRational(graph, partition) {
  // Is every node in every coalition in partition happier in its current coalition than it would be alone?
  // If not, return a counter-example.
  var nodes = Object.keys(graph);
  for (const coalition of partition)
    for (const node of coalition)
      if (!isAcceptable(graph, node, coalition))
        return [false, node];
  return [true, null];
}

function isAcceptable(graph, node, coalition) {
  // Is this coalition acceptable to node?
  return coalition.equals(new Set([node])) || graph[node].intersect(coalition).size > 0; 
}

// The next three stability concepts repeatedly use the same tests, so it is better to define them all at once
{
  // four different tests used in stability:

  // Is it actually a different coalition?
  let test0 = (graph, partition, node, homeCoalition, newCoalition, scoreFunc) =>
    !homeCoalition.equals(newCoalition);

  // Do I (the node) want to leave my home?
  let test1 = (graph, partition, node, homeCoalition, newCoalition, scoreFunc) =>
    scoreFunc(graph, node, newCoalition.plus(node)) > scoreFunc(graph, node, homeCoalition);

  // Is the new coalition okay with having me?
  let test2 = (graph, partition, node, homeCoalition, newCoalition, scoreFunc) =>
    newCoalition.every(nodeB => scoreFunc(graph, nodeB, newCoalition.plus(node)) >= scoreFunc(graph, nodeB, newCoalition));

  // Is my home okay with me leaving?
  let test3 = function(graph, partition, node, homeCoalition, newCoalition, scoreFunc) {
    let homeWithoutMe = homeCoalition.minus(node);
    return homeWithoutMe.every(nodeB => scoreFunc(graph,nodeB,homeWithoutMe) >= scoreFunc(graph,nodeB,homeCoalition));
  };

  // check if any possible vertex with a home coalition and a new coalition passes every test
  var makeCheckFunc = tests =>
    function(graph, partition, scoreFunc) {
      for (const homeCoalition of partition)
        for (const node of homeCoalition)
          for (const newCoalition of partition.plus(new Set([])))
            if (tests.every(test => test(graph, partition, node, homeCoalition, newCoalition, scoreFunc))) // if this situation passes every test
              return [false, node, newCoalition];
      return [true, null, null];
    }

  var isNashStable = makeCheckFunc([test0, test1]);
  var isIndividuallyStable = makeCheckFunc([test0, test1, test2]);
  var isContractuallyIndividuallyStable = makeCheckFunc([test0, test1, test2, test3]);
}

function isCoreStable(graph, partition, scoreFunc) {
  // Is this partition core-stable?
  // If not, give a counter-example.
  // TODO: also write weakly core stable version
  var homeScores = {};
  for (const coalition of partition)
    for (const node of coalition)
      homeScores[node] = scoreFunc(graph, node, coalition);
  var nodes = Object.keys(graph);
  var powerset = nodes.powerset().map(arr => new Set(arr));
  for (const coalition of powerset) {
    if (coalition.size==0) continue;
    var newScores = {}
    for (const node of coalition)
      newScores[node] = scoreFunc(graph, node, coalition)
    if (coalition.every(node => newScores[node] >= homeScores[node]) &&
      coalition.some(node => newScores[node] > homeScores[node]))
      return [false, coalition];
  }
  return [true, null];
}

function isStrictlyPopular(graph, partition, scoreFunc) {
  // Is this partition stictly popular?
  // If not, give a counter-example.
  var currentScores = {}
  for (const coalition of partition)
    for (const node of coalition)
      currentScores[node] = scoreFunc(graph, node, coalition);
  var nodes = Object.keys(graph)
  var n = nodes.length;
  var otherScores = {}; // will map nodes to node-coalition-value maps
  for (const node of nodes)
    otherScores[node] = {}; // This map is useful because the same subset occurs in many partitions.
  for (const otherPartition of nodes.partitionSet()) {
    if (partition.equals(otherPartition)) continue;
    var winCount = 0;
    for (const coalition of otherPartition) {
      var coalitionString = JSON.stringify(coalition);
      for (const node of coalition) {
        if (!otherScores[node][coalitionString])
          otherScores[node][coalitionString] = scoreFunc(graph, node, coalition);
        if (currentScores[node] > otherScores[node][coalitionString])
          winCount++;
        if (currentScores[node] < otherScores[node][coalitionString])
          winCount--;
      }
    }
    if (winCount <= 0)
      return [false, otherPartition, winCount];
  }
  return [true, null, null]
}

function isPerfect(graph, partition, scoreFunc) {
  // Is this partition perfect?
  // If not, give a counter-example.
  var nodes = Object.keys(graph);
  for (const coalition of partition)
    for (const node of coalition) {
      var homeScore = scoreFunc(graph, node, coalition);
      for (const otherCoalition of nodes.filter(n=>n!=node).powerset())
        if (scoreFunc(graph, node, otherCoalition.concat(node)) > homeScore)
          return [false, node, otherCoalition.concat(node)];
    }
  return [true, null, null];
}

// ** Other Tools **

function adjustPartition(partition, coalition) {
  // moves everyone in coalition out of their current coalitions and into a new
  // one together
  return sortPartition(partition.map(C => C.setMinus(coalition)).filter(C => C.length > 0).concat([coalition]));
}

function sortPartition(partition) {
  return partition.map(C => C.sort()).sort( (C1,C2) => JSON.stringify(C1).localeCompare(JSON.stringify(C2)));
}
