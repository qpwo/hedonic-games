// Luke Miles, June 2017
// Useful algorithms for arrays
// Public domain dedication

// TODO: integrate with vhedonism.js

Array.prototype.setEquals = function(arr) {
  // Would the arrays be equal as sets?
  return this.every(x => arr.includes(x)) && arr.every(x => this.includes(x));
}

Array.prototype.equals = function(arr) {
  // Do the arrays have the same string representation?
  if (this.length != arr.length)
    return false;
  for (let i=0; i<this.length; i++)
    if (this[i] != arr[i])
      return false;
  return true;
}

Array.prototype.plus = function(val) {
  let newArr = Array(this.length+1);
  let hasPlaced = 0;
  for (let i=0; i < this.length; i++) {
    let x = this[i];
    if ((!hasPlaced) && (val <= x)) {
      hasPlaced = 1;
      newArr[i] = val;
    }
    newArr[i+hasPlaced] = x;
  }
  if (!hasPlaced)
    newArr[this.length] = val;
  return newArr;
}

Array.prototype.minus = function(val) {
  let newArr = Array(this.length-1);
  let hasRemoved = 0;
  for (let i=0; i < this.length; i++) {
    let x = this[i];
    if ((!hasRemoved) && (val == x)) {
      hasRemoved = 1;
      continue;
    }
    newArr[i-hasRemoved] = x;
  }
  if (!hasRemoved)
    newArr.push(this[this.length-1]);
  return newArr;
}


Array.prototype.intersect = function(arr) {
  // an array of the elements that are in both arrays
  return this.filter(x => arr.includes(x));
}

Array.prototype.union = function(arr) {
  // an array of elements that are in at least one array
  return this.concat(arr.filter(x => !this.includes(x)));
}

Array.prototype.setMinus = function(arr) {
  return this.filter(x => !arr.includes(x))
}

Array.prototype.sum = function() {
  // the sum of the elements of an array
  return this.reduce((sum, x) => sum + x, 0);
}

Array.prototype.average = function() {
  // the average of the elements of an array
  if (this.length==0) return 0;
  return this.sum() / this.length;
}

Array.prototype.powerset = function() {
  // all the subsets of an array
  return this.reduceRight((a, x) => a.concat(a.map(y => [x].concat(y))), [[]]);
}

Array.prototype.max = function(key=(x=>x)) {
  // the maximum element of an array according to the key
  let best = this[0];
  let bestScore = key(best);
  for (i = 1; i < this.length; i++) {
    let score = key(this[i]);
    if (score > bestScore)
      [best, bestScore] = [this[i], score];
  }
  return best;
}

Array.prototype.partitionSet = function() {
  // The set of all partitions of a set.
  // Implemented from Knuth's TOACP volume 4a.
  // More items than 2^n but fewer than n!.
  let n = this.length;
  let partitions = [];
  let a = Array(n).fill().map(_ => 0);
  let b = Array(n).fill().map(_ => 1);
  let m = 1;
  while (true) {
    partitions.push(restrictedGrowthStringToPartition(a, this));
    while (a[n-1] != m) {
      a[n-1]++;
      partitions.push(restrictedGrowthStringToPartition(a, this));
    }
    let j = n - 2;
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
  let numBlocks = Math.max.apply(null, string);
  let partition = Array(numBlocks+1).fill().map(_ => []);
  string.forEach((blockNum, index) => partition[blockNum].push(arr[index]));
  return partition;
}
