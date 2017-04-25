// Luke Miles, April 2017
// Useful algorithms for arrays

Array.prototype.setEquals = function(arr) {
  // Would the arrays be equal as sets?
  return this.every(x => arr.includes(x)) && arr.every(x => this.includes(x));
}

Array.prototype.equals = function(arr) {
  // Do the arrays have the same string representation?
  return JSON.stringify(this)==JSON.stringify(arr);
}

Array.prototype.intersect = function(arr) {
  // an array of the elements that are in both arrays
  return this.filter(x => arr.includes(x));
}

Array.prototype.sum = function() {
  // the sum of the elements of an array
  if (this.length==0)
    return 0;
  return this.reduce((sum, x) => sum + x);
}

Array.prototype.powerset = function() {
  // all the subsets of an array
  return this.reduceRight((a, x) => a.concat(a.map(y => [x].concat(y))), [[]]);
}

Array.prototype.max = function(key=(x=>x)) {
  // the maximum element of an array according to the key
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
  // The set of all partitions of a set.
  // Implemented from Knuth's TOACP volume 4a.
  // More items than 2^n but fewer than n!.
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
  // Helper for Array.prototype.partitionSet.
  var numBlocks = Math.max.apply(null, string);
  var partition = Array(numBlocks+1).fill().map(_ => []);
  string.forEach((blockNum, index) => partition[blockNum].push(arr[index]));
  return partition;
}
