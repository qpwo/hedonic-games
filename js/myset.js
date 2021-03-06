// todo
// algorithms for sets

Set.prototype.map = function(f) {
  let set = new Set();
  for (const x of this)
    set.add(f(x));
  return set;
}

Set.prototype.intersect = function(set) {
  let intersection = new Set();
  for (const x of this)
    if (set.has(x))
      intersection.add(x);
  return intersection;
}

Set.prototype.setMinus = function(set) {
  let difference = new Set(this);
  for (const x of set) {
    difference.delete(x);
  }
  return difference;
}

Set.prototype.sum = function() {
  let total = 0;
  for (const x of this)
    total += x;
  return total;
}

Set.prototype.some = function(f) {
  for (const x of this)
    if (f(x))
      return true;
  return false;
}

Set.prototype.every = function(f) {
  for (const x of this)
    if (!f(x))
      return false;
  return true;
}

Set.prototype.filter = function(f) {
  let set = new Set();
  for (const x of this)
    if (f(x))
      set.add(x)
  return set;
}

Set.prototype.equals = function(set) {
  return this.every(x => set.has(x)) && set.every(x => this.has(x));
}

Set.prototype.plus = function(x) {
  let set = new Set(this);
  set.add(x);
  return set;
}

Set.prototype.minus = function(x) {
  let set = new Set(this);
  set.delete(x);
  return set;
}

Set.prototype.powerset = function() {
  // TODO eventually: make this a generator function
  return Array.from(this).powerset().map(arr => new Set(arr));
}

Set.prototype.stringify = function() {
  return '{' + Array.from(this).join(',') + '}';
}
