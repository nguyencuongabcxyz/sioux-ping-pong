// Test script to verify circular tie detection logic
// Based on the Table A data from the image

// Sample data representing the three tied teams
const teams = [
  { id: '1', name: 'Yen Dang & Minh Van', wins: 2, losses: 1, gameDifference: 1, pointDifferential: 6, points: 85 },
  { id: '2', name: 'Khoa Le & Cong Nguyen', wins: 2, losses: 1, gameDifference: 2, pointDifferential: -2, points: 89 },
  { id: '3', name: 'Cuong Phan & Thanh Dang', wins: 2, losses: 1, gameDifference: 2, pointDifferential: 14, points: 91 },
  { id: '4', name: 'Khanh Huynh & Han Ho', wins: 0, losses: 3, gameDifference: -5, pointDifferential: -18, points: 61 }
];

// Simulate head-to-head results (circular relationship)
const headToHeadMap = new Map();
// Team 1 beats Team 2
headToHeadMap.set('1-2', 1);
headToHeadMap.set('2-1', -1);
// Team 2 beats Team 3  
headToHeadMap.set('2-3', 1);
headToHeadMap.set('3-2', -1);
// Team 3 beats Team 1
headToHeadMap.set('3-1', 1);
headToHeadMap.set('1-3', -1);

console.log('Original teams order:');
teams.forEach((team, index) => {
  console.log(`${index + 1}. ${team.name} - W:${team.wins} L:${team.losses} GD:${team.gameDifference} PD:${team.pointDifferential}`);
});

// Group teams by wins
const teamsByWins = new Map();
for (const team of teams) {
  if (!teamsByWins.has(team.wins)) {
    teamsByWins.set(team.wins, []);
  }
  teamsByWins.get(team.wins).push(team);
}

// Check for circular ties in groups with 3+ teams
const circularTieGroups = new Set();
for (const [wins, teamsInGroup] of teamsByWins) {
  if (teamsInGroup.length >= 3) {
    console.log(`\nChecking group with ${wins} wins:`, teamsInGroup.map(t => t.name));
    
    // Check if this group has circular head-to-head relationships
    let hasCircularTie = false;
    for (let i = 0; i < teamsInGroup.length; i++) {
      for (let j = i + 1; j < teamsInGroup.length; j++) {
        for (let k = j + 1; k < teamsInGroup.length; k++) {
          const teamA = teamsInGroup[i];
          const teamB = teamsInGroup[j];
          const teamC = teamsInGroup[k];
          
          const abResult = headToHeadMap.get(`${teamA.id}-${teamB.id}`);
          const bcResult = headToHeadMap.get(`${teamB.id}-${teamC.id}`);
          const caResult = headToHeadMap.get(`${teamC.id}-${teamA.id}`);
          
          console.log(`Checking ${teamA.name} vs ${teamB.name} vs ${teamC.name}`);
          console.log(`  ${teamA.name}-${teamB.name}: ${abResult}`);
          console.log(`  ${teamB.name}-${teamC.name}: ${bcResult}`);
          console.log(`  ${teamC.name}-${teamA.name}: ${caResult}`);
          
          // If all three head-to-head results exist and form a circle, it's a circular tie
          if (abResult !== undefined && bcResult !== undefined && caResult !== undefined) {
            // Check if A beats B, B beats C, and C beats A (circular)
            if ((abResult > 0 && bcResult > 0 && caResult > 0) ||
                (abResult < 0 && bcResult < 0 && caResult < 0)) {
              hasCircularTie = true;
              console.log('  CIRCULAR TIE DETECTED!');
              break;
            }
          }
        }
        if (hasCircularTie) break;
      }
      if (hasCircularTie) break;
    }
    
    if (hasCircularTie) {
      // Mark all teams in this group as having circular ties
      for (const team of teamsInGroup) {
        circularTieGroups.add(team.id);
      }
      console.log(`All teams in ${wins}-win group marked as circular tie`);
    }
  }
}

console.log('\nCircular tie groups:', Array.from(circularTieGroups));

// Sort teams using the corrected logic
const sortedTeams = teams.sort((a, b) => {
  // 1. Tournament Points (most wins)
  if (a.wins !== b.wins) {
    return b.wins - a.wins
  }
  
  // 2. Head-to-Head Result (if tied, but skip if circular tie)
  // Only use head-to-head if neither team is in a circular tie group
  if (!circularTieGroups.has(a.id) && !circularTieGroups.has(b.id)) {
    const headToHeadKey = `${a.id}-${b.id}`;
    const headToHeadResult = headToHeadMap.get(headToHeadKey);
    if (headToHeadResult !== undefined) {
      if (headToHeadResult > 0) return -1;  // Team A won head-to-head
      if (headToHeadResult < 0) return 1;   // Team B won head-to-head
    }
  } else {
    console.log(`Skipping head-to-head for ${a.name} vs ${b.name} due to circular tie`);
  }
  
  // 3. Game Difference (games won - games lost) - higher difference first
  if (a.gameDifference !== b.gameDifference) {
    return b.gameDifference - a.gameDifference;
  }
  
  // 4. Point Difference (points scored - points conceded) - higher difference first
  if (a.pointDifferential !== b.pointDifferential) {
    return b.pointDifferential - a.pointDifferential;
  }
  
  // 5. Total points scored (tiebreaker)
  return b.points - a.points;
});

console.log('\nTeams after sorting with corrected logic:');
sortedTeams.forEach((team, index) => {
  console.log(`${index + 1}. ${team.name} - W:${team.wins} L:${team.losses} GD:${team.gameDifference} PD:${team.pointDifferential}`);
});

console.log('\nExpected correct order based on Point Difference:');
console.log('1. Cuong Phan & Thanh Dang (PD: +14)');
console.log('2. Yen Dang & Minh Van (PD: +6)');
console.log('3. Khoa Le & Cong Nguyen (PD: -2)');
console.log('4. Khanh Huynh & Han Ho (PD: -18)');
