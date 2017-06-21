function equalTreatmentScore(graph, node, coalition) {
  let n = Object.keys(graph).length;
  let k = coalition.size;
  let S = graph[node].intersect(coalition).plus(node);
  let total = 0;
  for (let nodeB of S)
    total += (n + 1) * graph[nodeB].intersect(coalition).size + 1 - k;
  return total / S.size;
}

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
  let G = {}
  for (const key of Object.keys(graph))
    G[key] = graph[key].map(n => n.toString());
  return G;
}

function p2s(p) {
  return p.map(set => Array.from(set).join('')).join('  ');
}

function printWholeCore(graph, scoreFunc) {
  var partitions = Object.keys(graph).partitionSet().map(p => p.map(c => new Set(c)));
  for (const p of partitions)
    if (isCoreStable(graph, p, scoreFunc)[0])
      console.log(p2s(p));
}

function checkEmptyCore(graph) {
  var partitions = Object.keys(graph).partitionSet().map(p => p.map(c => new Set(c)));
  for (const p of partitions)
    if (isCoreStable(graph, p, equalTreatmentScore)[0])
      return [false, p];
  return [true, null];
}

function graphToString(graph) {
  let s = "";
  for (const node of Object.keys(graph))
    s += node + ": " + Array.from(graph[node]).join(', ') + '\n';
  return s;
}

function connectedComponents(graph) {
  let nodes = Object.keys(graph);
  let todo = [nodes[0]];
  let done = [];
  let nodeIndices = {}
  let counter = 0;
  while (!done.setEquals(nodes)) {
    while (todo.length > 0) {
      let node = todo.pop();
      nodeIndices[node] = counter;
      for (const child of graph[node])
        if (!done.includes(child))
          todo.push(child);
      done.push(node);
    }
    for (const node of nodes)
      if (!done.includes(node)) {
        todo.push(node);
        counter++;
        break;
      }
  }
  return nodeIndices;
  let components = new Array(counter + 1).fill().map(_ => []);
  for (const node of nodes)
    components[nodeIndices[node]].push(node);
  return components;
}
