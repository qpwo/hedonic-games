function FOScore(graph, node, coalition) {
  // friend oriented score
  var n = Object.keys(graph).length;
  var friends = graph[node];
  var score = 0;
  for (const node2 of coalition) {
    if (node != node2)
      score += (friends.includes(node2) ? n : -1);
  }
  return score;
}

function friendAverage(graph, node, coalition) {
  // the average happiness of a node's friends in a given coalition
  var total = 0;
  var friendCount = 0;
  var friends = graph[node];
  for (const node2 of coalition) {
    if (friends.includes(node2)) {
      total += FOScore(graph, node2, coalition);
      friendCount += 1;
    }
  }
  return (total > 0 ? total / friendCount : 0);
}

function FOSFScore(graph, node, coalition) {
  // selfish-first score
  var n = Object.keys(graph).length;
  var myScore = FOScore(graph, node, coalition);
  var friendsScore = friendAverage(graph, node, coalition);
  return Math.pow(n, 5) * myScore + friendsScore;
}

function FOALScore(graph, node, coalition) {
  // altruistic treatment score
  var n = Object.keys(graph).length;
  var myScore = FOScore(graph, node, coalition);
  var friendsScore = friendAverage(graph, node, coalition);
  return myScore + Math.pow(n, 5) * friendsScore;
}

function FOEQScore(graph, node, coalition) {
  // equal treatment score
  var n = Object.keys(graph).length;
  var myScore = FOScore(graph, node, coalition);
  var friendsScore = friendAverage(graph, node, coalition);
  var numFriends = graph[node].filter(function(node2){
    return coalition.includes(node2);}).length;
  return myScore + numFriends * friendsScore;
}
