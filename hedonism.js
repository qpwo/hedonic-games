// Luke Miles, June 2017
// Algorithms for altruistic hedonic games
// Public domain dedication

// TODO: change order of functions
// possible TODO: rename coalitions to groups
// TODO eventually: add existence checks
// possible TODO eventually: allow different players to be of different type
// possible TODO eventually: allow directed graphs and weighted graphs

// ** Score Functions **

// possible TODO: shorten code for similar score functions with scoping
// TODO: add maxmin score thing

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
  let n = Object.keys(graph).length;
  let friends = coalition.intersect(graph[node]);
  if (friends.size == 0)
    return 0;
  let total = 0;
  let k = coalition.size
  for (const friend of friends)
    total += (n+1) * coalition.intersect(graph[friend]).size + 1 - k
  return total / friends.size;
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
  // node's altruistic-treatment score of coalition
  if (!coalition.has(node)) throw "coalition doesn't contain node";
  let n = Object.keys(graph).length;
  let myScore = FOScore(graph, node, coalition);
  let friendsScore = friendAverage(graph, node, coalition);
  return myScore + Math.pow(n, 5) * friendsScore;
}

function FOEQScore(graph, node, coalition) {
  // node's equal-treatment score of coalition
  if (!coalition.has(node)) throw "coalition doesn't contain node";
  let n = Object.keys(graph).length;
  let k = coalition.size;
  let S = graph[node].intersect(coalition).plus(node);
  let total = 0;
  for (const nodeB of S)
    total += (n+1) * coalition.intersect(graph[nodeB]).size + 1 - k;
  return total / S.size;
}


function fractionalScore(graph, node, coalition) {
  // node's fractional hedonic game score of coalition
  if (!coalition.has(node)) throw "coalition doesn't contain node";
  return coalition.intersect(graph[node]).size / coalition.size;
}

function additiveScore(graph, node, coalition) {
  // node's additively seperable hedonic game score of coalition
  if (!coalition.has(node)) throw "coalition doesn't contain node";
  return coalition.intersect(graph[node]).size;
}

// ** Stability Concepts **

function isIndividuallyRational(graph, partition, scoreFunc) {
  // Is every node in every coalition in partition happier in its home coalition than it would be alone?
  // If not, return a counter-example.
  let nodes = Object.keys(graph);
  for (const coalition of partition)
    for (const node of coalition)
      if (scoreFunc(graph, node, coalition) < scoreFunc(graph, node, new Set([node])))
        return [false, node];
  return [true, null];
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
          for (const newCoalition of partition.concat(new Set()))
            if (tests.every(test => test(graph, partition, node, homeCoalition, newCoalition, scoreFunc))) // if this situation passes every test
              return [false, node, newCoalition];
      return [true, null, null];
    }

  var isNashStable = makeCheckFunc([test0, test1]);
  var isIndividuallyStable = makeCheckFunc([test0, test1, test2]);
  var isContractuallyIndividuallyStable = makeCheckFunc([test0, test1, test2, test3]);
}

function isCoreStable(graph, partition, scoreFunc) {
  // Is this partition core-stable? If not, give a counter-example.
  let homeScores = {};
  for (const coalition of partition) for (const node of coalition)
    homeScores[node] = scoreFunc(graph, node, coalition);
  let powerset = Object.keys(graph).powerset().map(arr => new Set(arr));
  for (const coalition of powerset) {
    if (coalition.size==0) continue;
    if (coalition.every(node => scoreFunc(graph, node, coalition) > homeScores[node]))
      return [false, coalition];
  }
  return [true, null];
}

function isStrictlyCoreStable(graph, partition, scoreFunc) {
  // Is this partition strictly core-stable? If not, give a counter-example.
  let homeScores = {};
  for (const coalition of partition) for (const node of coalition)
    homeScores[node] = scoreFunc(graph, node, coalition);
  let powerset = Object.keys(graph).powerset().map(arr => new Set(arr));
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
  // Is this partition stictly popular? If not, give a counter-example.
  // TODO: make a non-strict version
  // TODO: seperate the winCount into separate for and against votes
  let homeScores = {};
  for (const coalition of partition) for (const node of coalition)
      homeScores[node] = scoreFunc(graph, node, coalition);
  let partitions = new Set(Object.keys(graph)).partitionSet();
  for (const partitionB of partitions) {
    let winCount = 0;
    for (const coalition of partitionB)
      for (const node of coalition) {
        let newScore = scoreFunc(graph, node, coalition);
        if (homeScores[node] > newScore)
          winCount++;
        if (homeScores[node] < newScore)
          winCount--;
      }
    if (winCount <= 0 && !partitionEquals(partitionB,partition))
      return [false, partitionB, winCount];
  }
  return [true, null, null]
}

function isPerfect(graph, partition, scoreFunc) {
  // Is this partition perfect? If not, give a counter-example.
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
  // Moves everyone in coalition out of their home coalitions and into a new one together
  return partition.map(coalitionB => coalitionB.setMinus(coalition)).filter(coalitionB => coalitionB.size > 0).concat([coalition]);
}

function partitionEquals(partitionA, partitionB) {
  return partitionA.every(coalitionA => partitionB.some(coalitionB => coalitionA.equals(coalitionB)));
}
