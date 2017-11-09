// Luke Miles, November 2017
// Algorithms for altruistic hedonic games

// ** Score Functions **

// possible TODO: change these function to just take the values of the
// coalitions, seperate the getting out to another function 

function sum(array, group) {
  // additive hedonic games
  let x = 0;
  for (const i of group)
    x += array[i];
  return x;
}

function mean(array, group) {
  // fractional hedonic games
  return sum(array, group) / array.length;
}

function median(array, group) {
  const values = group.map(i => array[i]).sort((a,b)=>a-b);
  const middle = Math.floor(values.length/2);
  if (values.length % 2 == 1)
    return values[middle];
  return (values[middle-1] + values[middle])/2;
}

function max(array, group) {
  // B hedonic games
  let biggest = -Infinity;
  for (const i of group) {
    const val = array[i];
    if (val > biggest)
      biggest = val;
  }
  return biggest;
}

function min(array, group) {
  // W hedonic games
  let smallest = Infinity;
  for (const i of group) {
    const val = array[i];
    if (val < smallest)
      smallest = val;
  }
  return smallest;
}

{ // scoping
  let countUp = function(array, group) {
    let friendCount = 0, enemyCount = 0;
    for (const i of group) {
      const val = array[i];
      if (val > 0)
        friendCount++;
      else
        enemyCount++;
    }
    return [friendCount, enemyCount];
  }
  function friendOriented(array, group) {
    const [friendCount, enemyCount] = countUp(array, group);
    return array.length * friendCount - enemyCount;
  }
  function enemyOriented(array, group) {
    const [friendCount, enemyCount] = countUp(array, group);
    return friendCount - array.length * enemyCount;
  }
}

// ** Stability Concepts **

function isIndividuallyRational(matrix, partition, score) {
  // Is every player in every group in partition happier in its home group than it would be alone?
  for (const group of partition)
    for (const i of group)
      if (score(matrix[i], [i]) > score(matrix[i], group))
        return [false, i, groupElope(partition, [i])]
  return [true, null, null];
}

// The next three stability concepts repeatedly use the same tests, so it is better to define them all at once
{
  // four different tests used in stability:

  // Is it actually a different group?
  let test0 = (matrix, partition, i, home, target, score) =>
    !home.equals(target);

  // Do I  want to leave my home?
  let test1 = (matrix, partition, i, home, target, score) =>
    score(matrix[i], target.plus(i)) > score(matrix[i], home);

  // Is the new group okay with having me?
  let test2 = (matrix, partition, i, home, target, score) =>
    target.every(j => score(matrix[j], target.plus(i)) >= score(matrix[j], target))

  // Is my home okay with me leaving?
  var test3 = function(matrix, partition, i, home, target, score) {
    let newHome = home.minus(i);
    return newHome.every(j => score(matrix[j], newHome) >= score(matrix[j], home));
  };

  // check if any possible vertex with a home group and a new group passes every test
  let makeCheckFunc = function(tests) {
    return function(matrix, partition, score) {
      for (const home of partition)
        for (const i of home)
          for (const target of partition)
            if (tests.every(test => test(matrix, partition, i, home, target, score))) // if this situation passes every test
              return [false, [i, target], groupElope(partition, target.plus(i))];
      return [true, null, null];
    }
  }

  var isNashStable = makeCheckFunc([test0, test1]);
  var isIndividuallyStable = makeCheckFunc([test0, test1, test2]);
  var isContractuallyStable = makeCheckFunc([test0, test1, test3]);
  var isContractuallyIndividuallyStable = makeCheckFunc([test0, test1, test2, test3]);
}

function isCoreStable(matrix, partition, score) {
  let homeScores = Array(matrix.length);
  for (const group of partition)
    for (const i of group)
      homeScores[i] = score(matrix[i], group);
  let powerset = range(matrix.length).powerset();
  for (const group of powerset) {
    if (group.size==0) continue; // we don't care about the empty group
    if (group.every(i => score(matrix[i], group) > homeScores[i]))
      return [false, group, groupElope(partition, group)];
  }
  return [true, null];
}

function isStrictlyCoreStable(matrix, partition, score) {
  let homeScores = Array(matrix.length);
  for (const group of partition)
    for (const i of group)
      homeScores[i] = score(matrix[i], group);
  let powerset = range(matrix.length).powerset();
  for (const group of powerset) {
    if (group.size==0) continue; // we don't care about the empty group
    if (group.every(i => score(matrix[i], group) >= homeScores[i]))
      if (group.any(i => score(matrix[i], group) > homeScores[i]))
        return [false, group, groupElope(partition, group)];
  }
  return [true, null, null];
}

{
  let makeTest = function(minimumLead) {
    return function(matrix, partition, score) {
      let homeScores = Array(matrix.length);
      for (const group of partition)
        for (const i of group)
          homeScores[i] = score(matrix[i], group);
      for (let partition2 of range(matrix.length).partitionSet()) {
        let winCount = 0;
        for (const group of partition2)
          for (const i of group)
            winCount += Math.sign(score(matrix[i], group) - homeScores[i]);
        if (winCount >= minimumLead && !partitionEquals(partition,partition2))
          return [false, [partition2, winCount], partition2];
      }
      return [true, null, null]
    };
  };
  var isPopular = makeTest(1);
  var isStrictlyPopular = makeTest(0);
}

function isPerfect(matrix, partition, score) {
  const players = range(matrix.length);
  for (const group of partition)
    for (const i of group) {
      const homeScore = score(graph, i, group);
      const groups = players.minus(i).powerset();
      for (const group2 of groups) {
        const g = group2.plus(i);
        if (group.equals(g)) continue;
        const newScore = score(matrix, i, g)
        if (newScore > homeScore)
          return [false, [i, g], groupElope(partition, g)];
      }
    }
  return [true, null, null];
}

// ** Other Tools **

function groupElope(partition, group) {
  // Moves everyone in group out of their home groups and into a new one together
  let newGroups = [];
  for (const g of partition) {
    let newg = [];
    for (const i of g)
      if (!group.includes(i))
        newg.push(i);
    if (newg.length > 0)
      newGroups.push(newg)
  }
  newGroups.push(group);
  newGroups.sort((arr1,arr2) => arr1[0] - arr2[0]); // sorting by first elements is sufficient because arrays are disjoint
  return newGroups;
}

function partitionEquals(partition1, partition2) {
  // Do partition1 and partitionB contain the exact same sets?
  if (partition1.length != partition2.length)
    return false;
  for (let i=0; i<partition1.length; i++)
    if (!partition1[i].equals(partition2[i]))
      return false;
  return true;
}

function checkExistence(matrix, score, stability) {
  for (let partition of range(matrix.length).partitionSet()) {
    if (stability(matrix, partition, score)[0])
      return [true, partition];
  }
  return [false, null];
}

function range(n) {
  return Array(n).fill().map((_,i)=>i);
}
