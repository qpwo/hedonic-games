// I think this code is completely functional. No globals or anything.

// Todo eventually: have a button to calculate everyone's FOScore just once.
// Then re-use the values.

function FOScore(graph, node, coalition) {
  // node's friend oriented score of coalition
  var n = Object.keys(graph).length;
  var friends = graph[node];
  return coalition.map(node2 => (node2 == node ? 0 : (friends.includes(node2) ? n : -1))).sum();
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

function isIndividuallyRational(graph, partition) {
  // returns true if every node in every coalition in partition is happier in
  // her current coalition than she would be alone
  var nodes = Object.keys(graph);
  for (const coalition of partition)
    for (const node of coalition)
      if (!isAcceptable(graph, node, coalition))
        return [false, node];
  return [true, null];
}

function isPerfect(graph, partition, scoreFunc) {
  var favoriteCoalitions = findFavoriteCoalitions(graph, scoreFunc);
  for (const coalition of partition)
    for (const node of coalition)
      if (favoriteCoalitions[node] != coalition)
        return [false, node, favoriteCoalitions];
  return [true, null, null]
}

function isCoreStable(graph, partition, scoreFunc) {
  // returns whether or not a given partition is core stable
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
      friendCount += 1;
    }
  return (total > 0 ? total / friendCount : 0);
}

function isAcceptable(graph, node, coalition) {
  // returns true if this coalition is acceptable to the node
  return coalition.equals([node]) ||
    graph[node].intersect(coalition).length > 0;
}

Array.prototype.max = function(key=(x=>x)) {
  // return the maximum element of an array according to the key
  var best = this[0];
  var bestScore = key(best);
  for (i = 1; i < this.length; i++) {
    var score = key(this[i]);
    if (score > bestScore)
      [best, bestScore] = [this[i], score];
  }
  return best;
}

Array.prototype.powerset = function() {
  // returns all the subsets of an array
  return this.reduceRight((a, x) => a.concat(a.map(y => [x].concat(y))), [[]]);
}

Array.prototype.equals = function(arr) {
  // returns true if the elements are pairwise equal
  return (this.length == arr.length) && this.every((x, i) => (x == arr[i]));
}

Array.prototype.intersect = function(arr) {
  // returns an array of the elements that are in both arrays
  return this.filter(x => arr.includes(x));
}

Array.prototype.sum = function() {
  // returns the sum of the elements of an array
  if (this.length==0)
    return 0;
  return this.reduce((sum, x) => sum + x);
}
