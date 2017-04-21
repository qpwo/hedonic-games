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


function isNashStable(graph, partition, scoreFunc) {
  for (const coalition of partition)
    for (const node of coalition) {
      var homeScore = scoreFunc(graph, node, coalition);
      for (const otherCoalition of partition.concat([[]])) {
        if (otherCoalition.equals(coalition)) continue;
        if (scoreFunc(graph, node, otherCoalition) > homeScore)
          return [false, node, otherCoalition];
      }
    }
  return [true, null, null];
}

function isIndividuallyStable(graph, partition, scoreFunc) {
  for (const coalition of partition)
    for (const node of coalition) {
      var homeScore = scoreFunc(graph, node, coalition);
      for (const otherCoalition of partition.concat([[]])) {
        if (otherCoalition.equals(coalition)) continue;
        if (scoreFunc(graph, node, otherCoalition) <= homeScore) // do you want to move there?
          continue;
        if (otherCoalition.every(node2 => // do they want to host you?
            scoreFunc(graph, node2, otherCoalition) <=
            scoreFunc(graph, node2, otherCoalition.concat([node]))))
          return [false, node, otherCoalition];
      }
    }
  return [true, null, null];
}

function isStrictlyPopular(graph, partition, scoreFunc) {
  // expects the partition and the graph to be sorted lexicographically
  var currentScores = {}
  for (const coalition of partition)
    for (const node of coalition)
      currentScores[node] = scoreFunc(graph, node, coalition);
  var nodes = Object.keys(graph)
  var n = nodes.length;
  var otherScores = {}; // will map nodes to node-coalition-value maps
  for (const node of nodes)
    otherScores[node] = {};
  for (const otherPartition of nodes.partitionSet()) {
    if (partition.equals(otherPartition)) continue;
    var total = 0;
    for (const coalition of otherPartition) {
      var coalitionString = JSON.stringify(coalition);
      for (const node of coalition) {
        if (!otherScores[node][coalitionString])
          otherScores[node][coalitionString] = scoreFunc(graph, node, coalition);
        if (currentScores[node] > otherScores[node][coalitionString])
          total++;
        if (currentScores[node] < otherScores[node][coalitionString])
          total--;
      }
    }
    if (total <= 0)
      return [false, otherPartition];
  }
  return [true, otherScores]
}

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

Array.prototype.setEquals = function(arr) {
  // returns true if the arrays would be equal as sets
  return (this.length == arr.length) && this.every(x => arr.includes(x));
}

Array.prototype.equals = function(arr) {
  return JSON.stringify(this)==JSON.stringify(arr);
}

Array.prototype.intersect = function(arr) {
  // returns an array of the elements that are in both arrays
  // TODO: make this the fast version for sorted arrays
  return this.filter(x => arr.includes(x));
}

Array.prototype.sum = function() {
  // returns the sum of the elements of an array
  if (this.length==0)
    return 0;
  return this.reduce((sum, x) => sum + x);
}

Array.prototype.powerset = function() {
  // returns all the subsets of an array
  return this.reduceRight((a, x) => a.concat(a.map(y => [x].concat(y))), [[]]);
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

Array.prototype.partitionSet = function() {
  // Implemented from Knuth's TOACP volume 4a.
  // Returns the set of all partitions of a set.
  // More items than 2^n but fewer than n!
  var n = this.length;
  var partitions = [];
  var a = Array(n).fill().map(_ => 0);
  var b = Array(n).fill().map(_ => 1);
  var m = 1;
  while (true) {
    partitions.push(restrictedGrowthStringToPartition(a, this));
    while (a[n-1] != m) {
      a[n-1]++;
      partitions.push(restrictedGrowthStringToPartition(a, this));
    }
    var j = n - 2;
    while (a[j] == b[j])
      j--;
    if (j==0)
      break;
    a[j]++;
    m = b[j] + (a[j]==b[j]);
    j++;
    while (j<n-1) {
      a[j] = 0;
      b[j] = m;
      j++;
    }
    a[n-1] = 0;
  }
  return partitions;
}

function restrictedGrowthStringToPartition(string, arr) {
  // Converts a restricted growth string and an array into a partition of that array.
  // Helper for Array.prototype.powerset.
  var numBlocks = Math.max.apply(null, string);
  var partition = Array(numBlocks+1).fill().map(_ => []);
  string.forEach((blockNum, index) => partition[blockNum].push(arr[index]));
  return partition;
}
