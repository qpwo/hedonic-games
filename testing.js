// Luke Miles
// June 2017
// Experimental stuff to maybe eventually add to the hedonic game simulator

function cycleGraph(n) {
  // n is the number of nodes in the cycle
  if (n==1)
    return {0:[]};
  let G = {};
  G[0] = new Set([1, n-1]);
  G[n-1] = new Set([n-2, 0]);
  for (let i = 1; i <= n-2; i++)
    G[i] = new Set([i+1, i-1]);
  return stringy(G);
}

function starGraph(n) {
  // n is the number of branches on the star
  let G = {};
  G[0] = new Set(Array(n).fill().map( (_,i) => i+1));
  for (let i = 1; i <= n; i++)
    G[i] = new Set([0]);
  return stringy(G);
}

function randomGraph(n, p) {
  // n is the number of nodes in the graph
  // p is the probability of an edge between any two given nodes
  let G = {};
  for (let i = 0; i <= n-1; i++)
    G[i] = new Set();
  for (let i = 0; i <= n-1; i++)
    for (let j = i+1; j <= n-1; j++)
      if (Math.random() < p) {
        G[i].add(j);
        G[j].add(i);
      }
  return stringy(G);
}


function stringy(graph) {
  // Return a new graph with numbers turned into strings.
  // Necessary because Object.keys(graph) returns strings even if graph was created with numbers
  let G = {}
  for (const key of Object.keys(graph))
    G[key] = graph[key].map(n => n.toString());
  return G;
}

function p2s(p) {
  // simplified partition to string
  return p.map(set => Array.from(set).join('')).join('  ');
}

function printStablePartitions(graph, scoreFunc, stability) {
  // Prints all partitions that meet stability under scoreFunc
  var partitions = Object.keys(graph).partitionSet().map(p => p.map(c => new Set(c)));
  for (const partition of partitions)
    if (stability(graph, partition, scoreFunc)[0])
      console.log(p2s(partition));
}

function checkExistenceStablePartitions(graph, scoreFunc, stability) {
  // Checks if any partitions meet stability under scoreFunc
  var partitions = Object.keys(graph).partitionSet().map(p => p.map(c => new Set(c)));
  for (const partition of partitions)
    if (stability(graph, partition, scoreFunc)[0])
      return [true, partition];
  return [false, null];
}

function graphToString(graph) {
  let s = "";
  for (const node of Object.keys(graph))
    s += node + ": " + Array.from(graph[node]).join(', ') + '\n';
  return s;
}

function walkTowardsCore(graph, scoreFunc) {
  var partition = new Set([ new Set( Object.keys(graph) ) ]);
  var count = 0;
  while (true) {
    [coreStable, blockingCoalition] = isCoreStable(graph, partition, scoreFunc);
    if (coreStable)
      return [partition, count];
    if (count >= 100)
      return [null, count];
    partition = groupElope(partition, blockingCoalition);
    count++;
  }
}
