// I think this code is completely functional. No globals or anything.

// TODO eventually: have a button to calculate everyone's FOScore just once.
// Then re-use the values.

// ** Score Functions **

function FOScore(graph, node, coalition) {
  // node's friend oriented score of coalition
  var n = Object.keys(graph).length;
  var friends = graph[node];
  return coalition.map(node2 =>
    (node2 == node ? 0 : (friends.includes(node2) ? n : -1))).sum();
}

function FOSFScore(graph, node, coalition) {
  // node's selfish-first score of coalition
  var n = Object.keys(graph).length;
  var myScore = FOScore(graph, node, coalition);
  var friendsScore = friendAverage(graph, node, coalition);
  return Math.pow(n, 5) * myScore + friendsScore;
}

function FOALScore(graph, node, coalition) {
  // node's altruistic treatment score of coalition
  var n = Object.keys(graph).length;
  var myScore = FOScore(graph, node, coalition);
  var friendsScore = friendAverage(graph, node, coalition);
  return myScore + Math.pow(n, 5) * friendsScore;
}

function FOEQScore(graph, node, coalition) {
  // node's equal treatment score of coalition
  var n = Object.keys(graph).length;
  var myScore = FOScore(graph, node, coalition);
  var friendsScore = friendAverage(graph, node, coalition);
  var numFriends = coalition.intersect(graph[node]).length;
  return myScore + numFriends * friendsScore;
}

// ** Stability Concepts **

function isIndividuallyRational(graph, partition) {
  // returns true if every node in every coalition in partition is happier in
  // its current coalition than it would be alone
  var nodes = Object.keys(graph);
  for (const coalition of partition)
    for (const node of coalition)
      if (!isAcceptable(graph, node, coalition))
        return [false, node];
  return [true, null];
}

[isNashStable, isIndividuallyStable, isContractuallyIndividuallyStable] =
  (function(){
    // four different tests used in stability:
    // (G=graph,P=partition,n=node,C1=homeCoalition,C2=otherCoalition,SF=scoreFunc)
    // Is it actually a different coalition?
    var test0 = (G, P, n, C1, C2, SF) => (!C1.equals(C2));
    // Do I (the node) want to leave my home?
    var test1 = (G, P, n, C1, C2, SF) => (SF(G, n, C2) > SF(G, n, C1));
    // Is the new coalition okay with having me?
    var test2 = (G, P, n, C1, C2, SF) => (C2.every(n2 => SF(G, n2, C2.concat([n])) >= SF(G, n2, C2)));
    // Is my home okay with me leaving?
    var test3 = (G, P, n, C1, C2, SF) => ((C1wn => C1wn.every(n1 => SF(G,n1,C1wn) >= SF(G,n1,C1)))(C1.filter(n1=>n1!=n)));

    // check if any possible vertex with a home coalition and a new coalition passes every test
    var makeCheckFunc = tests =>
      function(G, P, SF) {
        for (const C1 of P) for (const n of C1) for (const C2 of P.concat([[]]))
          if (tests.every(test => test(G, P, n, C1, C2, SF))) // if this situation passes every test
            return [false, n, C2];
        return [true, null, null];
      }

    return [makeCheckFunc([test0, test1]),
      makeCheckFunc([test0, test1, test2]),
      makeCheckFunc([test0, test1, test2, test3])];
  })();

function isCoreStable(graph, partition, scoreFunc) {
  // returns true if the partition is core stable, otherwise
  // returns a blocking coalition
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


function isPerfect(graph, partition, scoreFunc) {
  var favoriteCoalitions = findFavoriteCoalitions(graph, scoreFunc);
  for (const coalition of partition)
    for (const node of coalition)
      if (!favoriteCoalitions[node].setEquals(coalition))
        return [false, node, favoriteCoalitions];
  return [true, null, null];
}

// ** Helper Functions **

function findFavoriteCoalitions(graph, scoreFunc) {
  // returns an object containing every node's favorite coalition
  // slow. brute force.
  var favoriteCoalitions = {};
  var nodes = Object.keys(graph);
  for (const node of nodes) {
    var otherNodes = nodes.filter(n => (n != node));
    favoriteCoalitions[node] = otherNodes.powerset().max(coalition =>
      scoreFunc(graph,  node, coalition)).concat(node);
  }
  return favoriteCoalitions;
}


function friendAverage(graph, node, coalition) {
  // the average happiness of a node's friends in a given coalition
  var total = 0;
  var friendCount = 0;
  var friends = graph[node];
  for (const node2 of coalition)
    if (friends.includes(node2)) {
      total += FOScore(graph, node2, coalition);
      friendCount++;
    }
  return (total > 0 ? total / friendCount : 0);
}

function isAcceptable(graph, node, coalition) {
  // returns true if this coalition is acceptable to the node
  return coalition.equals([node]) ||
    graph[node].intersect(coalition).length > 0;
}
