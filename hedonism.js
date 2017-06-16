// Luke Miles, June 2017
// Algorithms for altruistic hedonic games
// Public domain dedication

// TODO: change order of functions
// possible TODO: rename coalitions to groups



// ** Score Functions **

// possible TODO: shorten code for similar score functions with scoping

function FOScore(graph, node, coalition) {
  // node's friend oriented score of coalition
  if (!coalition.has(node)) throw "coalition doesn't contain node";
  let n = Object.keys(graph).length;
  let numFriends = coalition.intersect(graph[node]).size;
  let numEnemies = coalition.size - numFriends - 1;
  return n * numFriends - numEnemies;
}

function EOScore(graph, node, coalition) {
  // node's enemy oriented score of coalition
  if (!coalition.has(node)) throw "coalition doesn't contain node";
  let n = Object.keys(graph).length;
  let numFriends = coalition.intersect(graph[node]).size;
  let numEnemies = coalition.size - numFriends - 1;
  return numFriends - n * numEnemies;
}


function friendAverage(graph, node, coalition) {
  // the average happiness of a node's friends in a given coalition
  let total = 0;
  let count = 0;
  for (const friend of coalition.intersect(graph[node])) {
    total += FOScore(graph, friend, coalition);
    count++;
  }
  return (count>0 ? total/count : 0);
}

function FOSFScore(graph, node, coalition) {
  // node's selfish-first score of coalition
  if (!coalition.has(node)) throw "coalition doesn't contain node";
  let n = Object.keys(graph).length;
  let myScore = FOScore(graph, node, coalition);
  let friendsScore = friendAverage(graph, node, coalition);
  return Math.pow(n, 5) * myScore + friendsScore;
}

function FOALScore(graph, node, coalition) {
  // node's altruistic treatment score of coalition
  if (!coalition.has(node)) throw "coalition doesn't contain node";
  let n = Object.keys(graph).length;
  let myScore = FOScore(graph, node, coalition);
  let friendsScore = friendAverage(graph, node, coalition);
  return myScore + Math.pow(n, 5) * friendsScore;
}

function FOEQScore(graph, node, coalition) {
  // node's equal treatment score of coalition
  if (!coalition.has(node)) throw "coalition doesn't contain node";
  let n = Object.keys(graph).length;
  let total = FOScore(graph, node, coalition);
  let count = 1;
  for (const friend of coalition.intersect(graph[node])) {
    total += FOScore(graph, friend, coalition)
    count++;
  }
  return total/count;
}

// ** Stability Concepts **

function isIndividuallyRational(graph, partition) {
  // Is every node in every coalition in partition happier in its home coalition than it would be alone?
  // If not, return a counter-example.
  let nodes = Object.keys(graph);
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
  let makeCheckFunc = tests =>
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
  let homeScores = {};
  for (const coalition of partition)
    for (const node of coalition)
      homeScores[node] = scoreFunc(graph, node, coalition);
  let nodes = Object.keys(graph);
  let powerset = nodes.powerset().map(arr => new Set(arr));
  for (const coalition of powerset) {
    if (coalition.size==0) continue;
    let newScores = {}
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
  // TODO: make a non-strict version
  // TODO: seperate the winCount into separate for and against votes
  let homeScores = {}
  for (const coalition of partition)
    for (const node of coalition)
      homeScores[node] = scoreFunc(graph, node, coalition);
  let nodes = Object.keys(graph)
  let n = nodes.length;
  for (const newPartition of (new Set(nodes)).partitionSet()) {
    if (newPartition.deepEquals(partition))
      continue;
    let winCount = 0;
    for (const coalition of newPartition)
      for (const node of coalition) {
        let newScore = scoreFunc(graph, node, coalition);
        if (homeScores[node] > newScore)
          winCount++;
        if (homeScores[node] < newScore)
          winCount--;
      }
    if (winCount <= 0)
      return [false, newPartition, winCount];
  }
  return [true, null, null]
}

function isPerfect(graph, partition, scoreFunc) {
  // Is this partition perfect?
  // If not, give a counter-example.
  let nodes = Object.keys(graph);
  for (const coalition of partition)
    for (const node of coalition) {
      let homeScore = scoreFunc(graph, node, coalition);
      let newCoalitions = (new Set(nodes)).minus(node).powerset().filter(coalitionB => !coalition.equals(coalitionB));
      for (const newCoalition of newCoalitions) {
        let newScore = scoreFunc(graph, node, newCoalition.plus(node));
        if (newScore > homeScore)
          return [false, node, newCoalition.plus(node)];
      }
    }
  return [true, null, null];
}

// ** Other Tools **

function groupElope(partition, coalition) {
  // moves everyone in coalition out of their home coalitions and into a new one together
  return partition.map(coalitionB => coalitionB.setMinus(coalition)).filter(coalitionB => coalitionB.size > 0).plus(coalition);
}
