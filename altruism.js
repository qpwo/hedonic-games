// Luke Miles, June 2017
// Algorithms for altruistic hedonic games
// Public domain dedication

// TODO eventually: The score functions, instead of adding the node to the
// coalition, should check if the node is already there and raise an error if
// its not.

// TODO eventually: everything should be implemented with sets instead of arrays.

// ** Score Functions **

function FOScore(graph, node, coalition) {
  // node's friend oriented score of coalition
  var n = Object.keys(graph).length;
  var friends = graph[node];
  return coalition.map(node2 =>
    (node2 == node ? 0 : (friends.includes(node2) ? n : -1))).sum();
}

function friendAverage(graph, node, coalition) {
  // the average happiness of a node's friends in a given coalition
  var total = 0;
  var count = 0;
  for (const friend of coalition.intersect(graph[node])) {
    total += FOScore(graph, friend, coalition);
    count++;
  }
  return (count > 0 ? total / count : 0);
}

function FOSFScore(graph, node, coalition) {
  // node's selfish-first score of coalition
  coalition = coalition.union([node]);
  var n = Object.keys(graph).length;
  var myScore = FOScore(graph, node, coalition);
  var friendsScore = friendAverage(graph, node, coalition);
  return Math.pow(n, 5) * myScore + friendsScore;
}

function FOALScore(graph, node, coalition) {
  // node's altruistic treatment score of coalition
  coalition = coalition.union([node]);
  var n = Object.keys(graph).length;
  var myScore = FOScore(graph, node, coalition);
  var friendsScore = friendAverage(graph, node, coalition);
  return myScore + Math.pow(n, 5) * friendsScore;
}

function FOEQScore(graph, node, coalition) {
  // node's equal treatment score of coalition
  coalition = coalition.union([node]);
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
  return coalition.equals([node]) || graph[node].intersect(coalition).length > 0;
}

// The next three stability concepts repeatedly use the same tests, so it is better to define them all at once
[isNashStable, isIndividuallyStable, isContractuallyIndividuallyStable] =
  (function(){
    // four different tests used in stability:
    // G=graph, P=partition, n=node, C1=homeCoalition, C2=otherCoalition, SF=scoreFunc
    // Is it actually a different coalition?
    var test0 = (G, P, n, C1, C2, SF) => !C1.equals(C2);
    // Do I (the node) want to leave my home?
    var test1 = (G, P, n, C1, C2, SF) => SF(G, n, C2) > SF(G, n, C1);
    // Is the new coalition okay with having me?
    var test2 = (G, P, n, C1, C2, SF) => C2.every(n2 => SF(G, n2, C2.concat([n])) >= SF(G, n2, C2));
    // Is my home okay with me leaving?
    var test3 = (G, P, n, C1, C2, SF) => (C1wn => C1wn.every(n1 => SF(G,n1,C1wn) >= SF(G,n1,C1)))(C1.filter(n1=>n1!=n));

    // check if any possible vertex with a home coalition and a new coalition passes every test
    var makeCheckFunc = tests =>
      function(G, P, SF) {
        for (const C1 of P) for (const n of C1) for (const C2 of P.concat([[]]))
          if (tests.every(test => test(G, P, n, C1, C2, SF))) // if this situation passes every test
            return [false, n, C2];
        return [true, null, null];
      }

    return [
      makeCheckFunc([test0, test1]),
      makeCheckFunc([test0, test1, test2]),
      makeCheckFunc([test0, test1, test2, test3])
    ];
  })();

function isCoreStable(graph, partition, scoreFunc) {
  // Is this partition core-stable?
  // If not, give a counter-example.
  var scores = {};
  for (const coalition of partition)
    for (const node of coalition)
      scores[node] = scoreFunc(graph, node, coalition);
  var nodes = Object.keys(graph);
  for (const coalition of nodes.powerset()) {
    if (coalition.length==0)
      continue;
    var newScores = {}
    for (const node of coalition)
      newScores[node] = scoreFunc(graph, node, coalition)
    if (coalition.every(node => newScores[node] >= scores[node]) &&
      coalition.some(node => newScores[node] > scores[node]))
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
        if (scoreFunc(graph, node, otherCoalition) > homeScore)
          return [false, node, otherCoalition];
    }
  return [true, null, null];
}

// ** Other Tools **

function adjustPartition(partition, coalition) {
  // moves everyone in coalition out of their current coalitions and into a new
  // one together
  return partition.map(C => C.filter(n => !coalition.includes(n))).filter(C => C.length > 0).concat([coalition]);
}
