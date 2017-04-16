// I think this code uses no global variables whatsoever.

function myAdd(a, b) {
  return a+b;
}

function rankCoalitions(network, player, coalitions) {
  coalitionArray = Object.keys(coalitions);
  for (let coalition of coalitionArray) {
    coalition.score = FOScore(network, player, coalition)
  }
  return coalitionArray.sort(function(coalition1, coalition2) {
    return coalition1.score > coalition2.score;})
}

function FOScore(network, player, coalition) {
  // friend-oriented score
  var friends = network[player];
  var n = Object.keys(network).length; // may or may not work
  var score = 0;
  for (const otherPlayer of coalition) {
    score += friends.includes(otherPlayer) ? n : -1;
  }
  return score;
}

function EOScore(network, player, coalition) {
  // enemy-oriented score
  var friends = network[player];
  var n = Object.keys(network).length;
  var score = 0;
  //for (const otherPlayer of coalition) {
    //score += (friends.includes(otherPlayer) ? 1 : (0 - n));
  //}
  return score;
}

function friendAverage(network, player, coalition) {
  // the average happiness of your friends in a given coalition
  var total = 0;
  var friendCount = 0;
  var friends = network[player];
  for (const otherPlayer of coalition) {
    if (friends.includes(otherPlayer)) {
      total += FOScore(network, otherPlayer, coalition);
      friendCount += 1;
    }
  }
  return total / friendCount;
}

function FOScoreSF(network, player, coalition) {
  // selfish-first altruistic friend-oriented score
  var n = Object.keys(network).length;
  var myScore = FOScore(network, player, coalition);
  var friendsScore = friendAverage(network, player, coalition);
  return Math.pow(n, 5) * myScore + friendScore;
}

function FOScoreEQ(network, player, coalition) {
  // equal-treatment altruistic friend-oriented score
  var myScore = FOScore(network, player, coalition);
  var friendsScore = friendAverage(network, player, coalition);
  var friends = network[player];
  var numFriends = coalition.filter(function(otherPlayer) {
    return friends.includes(otherPlayer)}).length;
  return myScore + numFriends * friendScore;
}

function FOScoreAL(network, player, coalition) {
  // truly altruistic friend-oriented score
  var n = Object.keys(network).length;
  var myScore = FOScore(network, player, coalition);
  var friendsScore = friendAverage(network, player, coalition);
  return myScore + Math.pow(n, 5) * friendScore;
}
