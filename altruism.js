function FOValue(graph, node, coalition) {
  var n = Object.keys(graph).length;
  var friends = graph[node];
  var value = 0;
  for (const node2 of coalition) {
    if (node != node2)
      value += (friends.includes(node2) ? n : -1);
  }
  return value;
}
