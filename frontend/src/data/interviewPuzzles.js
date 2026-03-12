/**
 * Interview puzzles dataset – curated for Interview Arena.
 * Only includes important, widely asked, unrepeated puzzles that are helpful for tech interviews.
 * Each puzzle has: id, title, category, difficulty, reward, question, hint, answer, companies.
 * Optional: verification_question, verification_options (4 strings), verification_answer (0–3 for A–D)
 * to require a correct verification MCQ after revealing the answer before claiming coins.
 * Difficulty filter in UI lets users practice by level (easy → medium → hard).
 * @see https://www.geeksforgeeks.org/aptitude/top-100-puzzles-asked-in-interviews/
 */

export const PUZZLE_CATEGORIES = [
  { key: 'all', label: 'All' },
  { key: 'logical', label: 'Logical' },
  { key: 'mathematical', label: 'Mathematical' },
  { key: 'arrangement', label: 'Arrangement' },
  { key: 'shape', label: 'Shape' },
  { key: 'other', label: 'Other' },
  { key: 'favorites', label: 'Favorites' },
  { key: 'completed', label: 'Completed' }
];

export const INTERVIEW_PUZZLES = [
  // —— Logical (most asked) ——
  {
    id: '3-bulbs-and-3-switches',
    title: '3 Bulbs and 3 Switches',
    category: 'logical',
    difficulty: 'medium',
    reward: 40,
    companies: ['MakeMyTrip', 'Qualcomm'],
    question: 'You are in a room with three light bulbs and three switches outside the room. Each switch controls one bulb, but you cannot see the bulbs from outside. You may flip the switches in any order, but you can only enter the room once to observe the bulbs. How do you determine which switch controls which bulb?',
    hint: 'Bulbs produce heat as well as light. What happens if you leave one switch on for a while, then turn it off and turn another on before entering?',
    answer: 'Turn switch 1 ON and leave it for about 5–10 minutes. Turn switch 1 OFF, turn switch 2 ON, and enter the room. The bulb that is ON is controlled by switch 2. The bulb that is OFF but still warm is controlled by switch 1. The bulb that is OFF and cold is controlled by switch 3.',
    verification_question: 'Which bulb corresponds to switch 1?',
    verification_options: ['Bulb that is ON', 'Bulb that is OFF but warm', 'Bulb that is OFF and cold', 'Cannot determine'],
    verification_answer: 1
  },
  {
    id: '100-prisoners-red-black-hats',
    title: '100 Prisoners with Red/Black Hats',
    category: 'logical',
    difficulty: 'hard',
    reward: 70,
    companies: ['Google', 'Microsoft'],
    question: '100 prisoners are lined up in a row, each wearing either a red or black hat. Each can see only the hats of everyone in front of them. Starting from the back, each prisoner must call out a single color (red or black). What strategy ensures at most one prisoner is wrong?',
    hint: 'The last prisoner can use their call to communicate parity (e.g. even/odd number of red hats they see). The others can then deduce their own hat color.',
    answer: 'The last prisoner counts the red hats they see. If the count is even they say "red", if odd they say "black"—they may be wrong, but that encodes the parity. Each subsequent prisoner can count the red hats in front of them and compare with the parity already "encoded" by previous answers to deduce their own hat color.',
    verification_question: 'What key idea allows the prisoners to ensure that at most one prisoner guesses incorrectly?',
    verification_options: ['Each prisoner guesses randomly', 'All prisoners guess the same color', 'The last prisoner encodes the parity (even/odd) of red hats', 'They count the total prisoners'],
    verification_answer: 2
  },
  {
    id: 'monty-hall-problem',
    title: 'Monty Hall Problem',
    category: 'mathematical',
    difficulty: 'medium',
    reward: 50,
    companies: ['VMWare'],
    question: 'You are on a game show. There are three doors: behind one is a car, behind the other two are goats. You pick a door (say Door 1). The host, who knows what is behind each door, opens another door (say Door 3) that has a goat. He then asks: do you want to stick with Door 1 or switch to Door 2? Is it better to switch?',
    hint: 'Work out the probability of winning if you stay vs switch. There are only three equally likely initial arrangements.',
    answer: 'Yes, you should switch. If you stay, you win only if your first pick was correct (1/3). If you switch, you win when your first pick was wrong (2/3). So switching doubles your chance of winning.',
    verification_question: 'What should you do to maximize your chance of winning the car?',
    verification_options: ['Stay with your first choice', 'Switch to the other closed door', 'It does not matter', 'Pick randomly'],
    verification_answer: 1
  },
  {
    id: 'camel-and-banana',
    title: 'Camel and Banana',
    category: 'logical',
    difficulty: 'hard',
    reward: 60,
    companies: ['Amazon', 'Yahoo'],
    question: 'A camel must carry 3000 bananas across a desert 1000 km wide. It can carry at most 1000 bananas at a time and eats 1 banana per km. What is the maximum number of bananas that can be delivered to the other side?',
    hint: 'The camel must make intermediate stops and leave banana caches. Think about how many trips are needed between key points to move bananas forward while minimizing consumption.',
    answer: 'The optimal strategy uses waypoints. Move bananas in stages so the camel makes multiple trips over shorter segments, leaving caches. The maximum delivered is 533 bananas (achieved by strategic caching at 200 km and 533 km, with 5, 3, and 1 trips in the segments).',
    verification_question: 'Why must the camel create intermediate banana caches while crossing the desert?',
    verification_options: ['Because it cannot carry all bananas at once', 'Because the camel walks slowly', 'Because bananas spoil quickly', 'Because the desert is uneven'],
    verification_answer: 0
  },
  {
    id: 'water-jug-problem',
    title: 'Water Jug Problem',
    category: 'logical',
    difficulty: 'medium',
    reward: 45,
    companies: ['Wells Fargo'],
    question: 'You have a 3-litre jug and a 5-litre jug and an unlimited supply of water. How do you measure exactly 4 litres using only these two jugs?',
    hint: 'Fill the 5-litre jug, pour into the 3-litre jug (leaving 2 in the 5). Empty the 3, pour the 2 from the 5 into the 3, then fill the 5 again.',
    answer: 'Fill 5L, pour into 3L (2L left in 5L). Empty 3L, pour 2L from 5L into 3L. Fill 5L again. Pour from 5L into 3L until 3L is full (1L goes in). Now 5L has exactly 4L left.',
    verification_question: 'After the steps in the answer, where are the 4 litres?',
    verification_options: ['In the 3L jug', 'In the 5L jug', 'Split between both jugs', 'You cannot get exactly 4L'],
    verification_answer: 1
  },
  {
    id: 'jar-contaminated-pills',
    title: 'Jar with Contaminated Pills',
    category: 'logical',
    difficulty: 'medium',
    reward: 45,
    companies: ['MakeMyTrip'],
    question: 'You have 10 jars of pills. In 9 jars each pill weighs 1 gram; in one jar each pill weighs 1.1 grams. You have a digital scale that gives an exact reading. How do you identify the contaminated jar with just one weighing?',
    hint: 'Take a different number of pills from each jar (e.g. 1 from jar 1, 2 from jar 2, …). The excess weight tells you which jar.',
    answer: 'Take 1 pill from jar 1, 2 from jar 2, …, 10 from jar 10. Weigh all together. If all were 1g, total would be 55g. The excess weight (in 0.1g units) equals the number of the contaminated jar.',
    verification_question: 'How do you identify which jar is contaminated from the scale reading?',
    verification_options: ['The reading in grams is the jar number', 'The excess weight in 0.1g units equals the jar number', 'You need a second weighing', 'The lightest total means jar 1 is contaminated'],
    verification_answer: 1
  },
  {
    id: 'gold-rod-7-units',
    title: 'Pay an Employee Using a Gold Rod of 7 Units',
    category: 'logical',
    difficulty: 'medium',
    reward: 40,
    companies: ['FAANG', 'Ola'],
    question: 'An employer has a gold rod of 7 units length. He must pay his worker 1 unit of gold per day for 7 days. He can make only 2 cuts to the rod. How does he pay exactly 1 unit each day?',
    hint: 'Cut the rod into segments that allow you to combine them to form 1, 2, 3, … units. Think 1, 2, 4.',
    answer: 'Cut the rod into segments of 1, 2, and 4 units. Day 1: give 1. Day 2: give 2. Day 3: give 1+2. Day 4: give 4. Day 5: give 4+1. Day 6: give 4+2. Day 7: give 4+2+1.',
    verification_question: 'Why are the gold rod pieces cut into lengths 1, 2, and 4?',
    verification_options: ['So the worker can be paid every day using combinations', 'Because gold breaks evenly', 'Because the worker prefers small pieces', 'To reduce cutting effort'],
    verification_answer: 0
  },
  {
    id: 'fastest-3-horses',
    title: 'Find the Fastest 3 Horses',
    category: 'logical',
    difficulty: 'medium',
    reward: 50,
    companies: ['Accolite', 'Goldman Sachs', 'MakeMyTrip', 'Oracle'],
    question: 'You have 25 horses and a race track that can race 5 horses at a time. You have no stopwatch. What is the minimum number of races needed to find the fastest 3 horses?',
    hint: 'First run 5 races (all 25 horses). Then run a 6th race with the winners of each heat. The winner of that is #1. Which others could possibly be #2 and #3?',
    answer: '7 races. Race 1–5: run all 25 in groups of 5. Race 6: race the 5 winners; call the winner A. A is 1st. For 2nd and 3rd you only need to consider: 2nd and 3rd from A’s heat, 1st and 2nd from B’s heat (where B was 2nd in race 6), and 1st from C’s heat. Race 7: race these 5 to get 2nd and 3rd overall.',
    verification_question: 'Why are only certain horses considered in the final race?',
    verification_options: ['Other horses are guaranteed to be slower', 'The race track holds only five horses', 'Some horses become tired', 'The fastest horse already won'],
    verification_answer: 0
  },
  {
    id: '5-pirates-100-gold-coins',
    title: '5 Pirates and 100 Gold Coins',
    category: 'logical',
    difficulty: 'hard',
    reward: 65,
    companies: ['Microsoft'],
    question: 'Five pirates find 100 gold coins. They vote on how to split them. The senior pirate proposes a split. If at least half (including the proposer) agree, it is accepted. Otherwise the proposer is thrown overboard and the next senior proposes. Pirates are rational and greedy. What split does the senior pirate propose?',
    hint: 'Work backwards from 2 pirates, then 3, then 4, then 5. With 2 pirates, the senior takes all 100. With 3, the senior needs one vote besides their own.',
    answer: 'Senior proposes: 98 for themselves, 0 to the next, 1 to the 3rd, 0 to the 4th, 1 to the 5th. The 3rd and 5th get more than they would if the proposal failed (0 in the 4-pirate subgame), so they vote yes; with the senior that’s 3 votes.',
    verification_question: 'Why does the senior pirate give coins to specific pirates?',
    verification_options: ['To secure enough votes for approval', 'To reward loyalty', 'To divide coins equally', 'To follow pirate traditions'],
    verification_answer: 0
  },
  {
    id: '8-balls-problem',
    title: '8 Balls Problem',
    category: 'logical',
    difficulty: 'medium',
    reward: 45,
    companies: ['Microsoft', 'Siemens'],
    question: 'You have 8 identical-looking balls. One is heavier than the rest. Using a balance scale only twice, how do you find the heavy ball?',
    hint: 'Split into two groups of 3 and leave 2 aside. First weighing: compare two groups of 3.',
    answer: 'Weighing 1: Put 3 balls on each side. If equal, the heavy one is among the 2 not weighed—weigh them to find it. If one side is heavier, take those 3. Weighing 2: Weigh 1 vs 1 of those 3; if equal, the 3rd is heavy; otherwise the heavier pan has the heavy ball.',
    verification_question: 'Why are the balls divided into two groups of three in the first weighing?',
    verification_options: ['To narrow down the heavy ball efficiently', 'To make the scale balanced', 'To test every ball individually', 'To reduce measurement error'],
    verification_answer: 0
  },
  {
    id: 'farmer-goat-wolf-cabbage',
    title: 'Farmer, Goat, Wolf, and Cabbage',
    category: 'logical',
    difficulty: 'medium',
    reward: 45,
    companies: ['Infosys'],
    question: 'A farmer must cross a river with a wolf, a goat, and a cabbage. The boat holds only the farmer and one other. If left alone, the wolf eats the goat and the goat eats the cabbage. How does the farmer get all across safely?',
    hint: 'The farmer must take the goat first (otherwise wolf eats goat or goat eats cabbage). Then return and take either wolf or cabbage; but if they leave wolf and goat, they must bring goat back.',
    answer: 'Take goat across; return. Take wolf across; bring goat back. Take cabbage across; return. Take goat across. All four are on the other side safely.',
    verification_question: 'Why must the farmer take the goat across first?',
    verification_options: ['Because the goat is lighter', 'Because leaving wolf and goat or goat and cabbage together causes problems', 'Because the wolf cannot swim', 'Because the cabbage spoils'],
    verification_answer: 1
  },
  {
    id: 'mislabeled-jars',
    title: 'Mislabeled Jars',
    category: 'logical',
    difficulty: 'easy',
    reward: 35,
    companies: ['Google', 'Microsoft'],
    question: 'You have three jars. One contains only apples, one only oranges, one a mix. The labels (Apple, Orange, Mixed) are all wrong. You may pick one fruit from one jar. How do you correctly relabel all three jars?',
    hint: 'Pick from the jar labeled "Mixed". If you get an apple, that jar is actually all apples; the jar labeled "Apple" must be oranges or mixed; but "Orange" is wrong so it must be mixed.',
    answer: 'Pick from the jar labeled "Mixed". Suppose you get an apple. Then that jar is Apple (not mixed). The jar labeled "Apple" cannot be apple (label wrong), and cannot be mixed (we know Mixed jar is Apple), so it is Orange. The remaining jar is Mixed. Same logic if you pick an orange.',
    verification_question: 'Why must you pick a fruit from the jar labeled \'Mixed\'?',
    verification_options: ['Because that jar definitely contains both fruits', 'Because all labels are wrong', 'Because mixed jars contain more fruit', 'Because oranges weigh more'],
    verification_answer: 1
  },
  {
    id: 'heaven-and-hell',
    title: 'Heaven and Hell',
    category: 'logical',
    difficulty: 'medium',
    reward: 50,
    companies: ['Amazon', 'Infosys'],
    question: 'You stand at a fork: one path leads to Heaven, one to Hell. Two guards: one always tells the truth, one always lies. You may ask one guard one question. What question do you ask to find the path to Heaven?',
    hint: 'Ask something that forces both guards to point to the same door—e.g. "What would the other guard say is the path to Heaven?" then choose the opposite.',
    answer: 'Ask either guard: "If I asked the other guard which path leads to Heaven, what would they point to?" Then take the opposite path. The truth-teller reports the liar’s (wrong) direction; the liar reports the opposite of the truth-teller’s (correct) direction—so both point to Hell; you go the other way.',
    verification_question: 'Why does asking \'What would the other guard say?\' work?',
    verification_options: ['It forces both guards to indicate the wrong path', 'It reveals the truth directly', 'It confuses the guards', 'It avoids asking questions'],
    verification_answer: 0
  },
  {
    id: '2-eggs-100-floors',
    title: '2 Eggs and 100 Floors',
    category: 'mathematical',
    difficulty: 'hard',
    reward: 65,
    companies: ['VMWare'],
    question: 'You have two identical eggs and a 100-story building. Find the highest floor from which an egg can be dropped without breaking. What is the minimum number of drops needed in the worst case?',
    hint: 'If the first egg breaks at floor n, you have one egg left and must check 1 to n-1 linearly. So use the first egg to reduce the range: try floors that decrease the remaining interval (e.g. 14, 27, 39, …).',
    answer: 'Start at floor 14; if it breaks, use the second egg on 1–13 (max 14 drops). If not, go to 14+13=27, then 27+12=39, etc. The sequence 14, 27, 39, 50, 60, 69, 77, 84, 90, 95, 99 ensures at most 14 drops in the worst case.',
    verification_question: 'Why are the first egg drops spaced 14, 13, 12 floors apart?',
    verification_options: ['To balance the worst-case number of drops', 'To prevent egg damage', 'To reduce time', 'To simplify counting'],
    verification_answer: 0
  },
  {
    id: 'torch-and-bridge',
    title: 'Torch and Bridge',
    category: 'mathematical',
    difficulty: 'hard',
    reward: 60,
    companies: ['Google', 'Microsoft'],
    question: 'Four people must cross a bridge at night. They have one torch. The bridge holds at most two people. Speeds: 1, 2, 5, and 10 minutes. How do you get all across in the minimum time?',
    hint: 'The slowest (5 and 10) should cross together when possible. Use the two fastest (1 and 2) to ferry the torch back.',
    answer: '1 and 2 cross (2 min). 1 returns (1 min). 5 and 10 cross (10 min). 2 returns (2 min). 1 and 2 cross (2 min). Total: 17 minutes.',
    verification_question: 'Why should the two fastest people handle the torch returns?',
    verification_options: ['They minimize total crossing time', 'They know the bridge best', 'They carry the torch safely', 'They cross first'],
    verification_answer: 0
  },
  {
    id: 'measuring-45-minutes-wires',
    title: 'Measure 45 Minutes Using Two Identical Wires',
    category: 'other',
    difficulty: 'medium',
    reward: 45,
    companies: ['MakeMyTrip'],
    question: 'You have two identical wires. Each takes exactly 60 minutes to burn from one end to the other, but the burn rate is uneven (e.g. half the wire might burn in 10 min or 50 min). How do you measure exactly 45 minutes?',
    hint: 'Light the first wire from both ends and the second from one end. When the first is done, 30 minutes have passed and the second has 30 minutes left. Then light the second from the other end.',
    answer: 'Light wire 1 from both ends and wire 2 from one end. When wire 1 is fully burned (30 min), light wire 2 from the other end. Wire 2 will burn out in another 15 min. Total: 30 + 15 = 45 minutes.',
    verification_question: 'Why does lighting a wire from both ends halve its burn time?',
    verification_options: ['Because fire spreads from both directions', 'Because the wire burns evenly', 'Because it increases temperature', 'Because the wire shortens'],
    verification_answer: 0
  },
  {
    id: '10-coins-puzzle',
    title: '10 Coins Puzzle',
    category: 'arrangement',
    difficulty: 'medium',
    reward: 40,
    companies: ['Google', 'Yahoo'],
    question: 'You have 10 bags of coins. In 9 bags each coin weighs 10g; in one bag each coin weighs 9g. You have a digital scale that gives one exact reading. How do you find the lighter bag with one weighing?',
    hint: 'Take 1 coin from bag 1, 2 from bag 2, …, 10 from bag 10. Weigh all. The deficit from 550g (if all were 10g) tells you the bag.',
    answer: 'Take 1 coin from bag 1, 2 from bag 2, …, 10 from bag 10. Weigh once. If all were 10g, total = 550g. The number of grams short of 550 equals the number of the lighter bag.',
    verification_question: 'If all coins were 10g, what would the total weight of the sample be?',
    verification_options: ['100g', '550g', '500g', '55g'],
    verification_answer: 1
  },
  {
    id: '3-ants-and-triangle',
    title: '3 Ants and Triangle',
    category: 'shape',
    difficulty: 'medium',
    reward: 45,
    companies: ['Intuit', 'ZS Associate', 'EXL'],
    question: 'Three ants sit at the corners of an equilateral triangle. Each ant moves along an edge toward a random corner (each chooses randomly). What is the probability that no two ants collide?',
    hint: 'Ants collide only if they all go clockwise or all anticlockwise. Each ant has 2 choices; total outcomes = 2^3 = 8.',
    answer: 'Each ant can go clockwise or anticlockwise (2 choices each). No collision only when they are not all the same direction. So 2 favourable outcomes out of 8. P(no collision) = 2/8 = 1/4. So P(collision) = 3/4.',
    verification_question: 'When do the ants collide while moving along triangle edges?',
    verification_options: ['When they all move in the same direction', 'When they move randomly', 'When they stay still', 'When two move clockwise'],
    verification_answer: 0
  },
  {
    id: 'chessboard-and-dominos',
    title: 'Chessboard and Dominos',
    category: 'shape',
    difficulty: 'medium',
    reward: 50,
    companies: ['Google'],
    question: 'A standard 8×8 chessboard has two opposite corners removed. Can you cover the remaining 62 squares with 31 dominoes (each covering 2 adjacent squares)?',
    hint: 'Each domino covers one black and one white square. Count black and white squares on the mutilated board.',
    answer: 'No. Opposite corners are the same color (e.g. both black). So the board has 32 of one color and 30 of the other. Each domino covers one black and one white square. 31 dominoes would need 31 of each color, but we have 32 and 30—so it’s impossible.',
    verification_question: "Why can't the mutilated chessboard be covered by dominoes?",
    verification_options: ['Because dominoes are too large', 'Because the board has unequal numbers of black and white squares', 'Because the board has fewer squares', 'Because dominoes overlap'],
    verification_answer: 1
  },
  {
    id: '50-red-50-blue-marbles',
    title: '50 Red and 50 Blue Marbles',
    category: 'mathematical',
    difficulty: 'medium',
    reward: 50,
    companies: ['Google', 'Microsoft', 'JP Morgan'],
    question: 'Two boxes: one has 50 red and 50 blue marbles, the other has 100 marbles (all red or all blue, unknown). You may redistribute the marbles between the two boxes (e.g. move some from one to the other). Then one box is chosen at random and one marble is drawn from it. How do you maximize the probability of drawing a red marble?',
    hint: 'Put one red marble in one box and all other 99 marbles in the other. If you pick the first box, you get red; if the other, you get red with probability 99/100 if that box had all red (and 0 if all blue).',
    answer: 'Put 1 red marble in box 1 and the remaining 99 marbles in box 2. If box 1 is chosen: P(red)=1. If box 2 is chosen: P(red)=99/100 if the original 100 were all red, 0 if all blue. So overall P(red) = ½(1 + 99/100) = 99.5% (assuming the 100-marble box was all red); if it was 50-50, you can do similar optimization.',
    verification_question: 'How many red marbles do you put in the first box to maximize P(red)?',
    verification_options: ['0', '1', '50', '99'],
    verification_answer: 1
  },
  {
    id: 'poison-and-rat',
    title: 'Poison and Rat',
    category: 'mathematical',
    difficulty: 'hard',
    reward: 60,
    companies: ['Amazon'],
    question: 'You have 1000 bottles of wine; one is poisoned. The poison kills in exactly 24 hours. You have 10 rats. How do you find the poisoned bottle in 24 hours?',
    hint: 'Label bottles 0–999. Represent each number in binary (10 bits). Feed each rat the bottles whose binary has 1 in that bit. Which rats die gives the binary representation of the poisoned bottle.',
    answer: 'Number bottles 0–999. Each number has a unique 10-bit binary. Rat i gets wine from every bottle with bit i = 1. After 24 hours, the set of dead rats gives the binary digits of the poisoned bottle number. So one test, 10 rats, 1000 bottles.',
    verification_question: 'Why does using binary representation help identify the poisoned bottle?',
    verification_options: ['Each rat represents a binary bit', 'Binary reduces poison', 'Binary numbers are easier', 'Rats prefer binary bottles'],
    verification_answer: 0
  },
  {
    id: 'find-ages-of-daughters',
    title: 'Find Ages of Daughters',
    category: 'mathematical',
    difficulty: 'medium',
    reward: 45,
    companies: ['Google', 'Microsoft'],
    question: 'A man says: "I have 3 daughters. The product of their ages is 72. The sum of their ages equals the number of my house." The visitor says: "I need more information." The man says: "My eldest plays piano." What are the three ages?',
    hint: 'List factor triples of 72 and their sums. Two triples have the same sum; that is why the visitor needed more. "Eldest" implies a unique oldest.',
    answer: 'Factor triples of 72: (1,1,72) sum 74; (1,2,36) sum 39; (1,3,24) sum 28; (1,4,18) sum 23; (1,6,12) sum 19; (2,2,18) sum 22; (2,3,12) sum 17; (2,4,9) sum 15; (3,3,8) sum 14; (3,4,6) sum 13. Only (2,6,6) and (3,3,8) share a sum (14). "Eldest" implies one oldest: so 3, 3, 8.',
    verification_question: 'Why was the visitor initially unable to determine the ages?',
    verification_options: ['Multiple age combinations had the same sum', 'The product was incorrect', 'The daughters were twins', 'The visitor misheard'],
    verification_answer: 0
  },
  {
    id: 'bee-train-distance',
    title: 'Total Distance Travelled by Bee',
    category: 'mathematical',
    difficulty: 'easy',
    reward: 35,
    companies: ['Yahoo'],
    question: 'Two trains 100 km apart move toward each other at 50 km/h each. A bee starts from one train toward the other at 75 km/h, touches the other train, turns back, and repeats until the trains meet. What total distance does the bee travel?',
    hint: 'The trains meet in 1 hour. The bee flies at 75 km/h for 1 hour.',
    answer: 'Trains meet in 100/(50+50) = 1 hour. The bee flies at 75 km/h for 1 hour, so it travels 75 km total.',
    verification_question: 'Why does calculating the meeting time of the trains solve the puzzle easily?',
    verification_options: ['The bee flies continuously until the trains meet', 'The bee stops halfway', 'The bee changes speed', 'The trains slow down'],
    verification_answer: 0
  },
  {
    id: '3-cuts-8-equal-pieces',
    title: '3 Cuts to Cut Round Cake into 8 Equal Pieces',
    category: 'shape',
    difficulty: 'easy',
    reward: 35,
    companies: ['Adobe', 'Cognizant', 'Blackrock'],
    question: 'How do you cut a round cake into 8 equal pieces using only 3 straight cuts? (You may not move pieces between cuts.)',
    hint: 'First two cuts are a perpendicular cross (4 pieces). The third cut is horizontal through the middle.',
    answer: 'Cut 1: vertical through the centre (2 halves). Cut 2: vertical perpendicular to the first (4 quarters). Cut 3: horizontal through the middle of the cake. You get 8 equal pieces (4 top, 4 bottom).',
    verification_question: 'What is the direction of the third cut?',
    verification_options: ['Vertical through the centre', 'Vertical perpendicular to the first', 'Horizontal through the middle', 'Diagonal'],
    verification_answer: 2
  },
  {
    id: 'elevator-puzzle',
    title: 'Elevator Puzzle',
    category: 'other',
    difficulty: 'medium',
    reward: 40,
    companies: ['FAANG'],
    question: 'A building has 10 floors. One person lives on each floor. The elevator is initially at floor 1. On average, how many floors does the elevator travel to serve all 10 people once (each person calls the elevator from their floor to go to floor 1)?',
    hint: 'Consider the order in which people are picked up. The elevator must go to each floor at least once. Think about the expected position after each pickup.',
    answer: 'Various formulations exist. A common approach: the elevator goes to each floor once to pick everyone up, then to floor 1. So it visits floors 2,3,…,10 and 1. Total floors travelled = 9 (up) + 9 (down to 1) = 18, or similar depending on whether "travel" counts one-way or round trip.',
    verification_question: 'How many floors does the elevator travel (one-way) to serve all 10 people (up then down to 1)?',
    verification_options: ['9', '18', '10', '20'],
    verification_answer: 1
  },
  {
    id: 'ratio-boys-girls-country',
    title: 'Ratio of Boys and Girls in a Country Where People Want Only Boys',
    category: 'mathematical',
    difficulty: 'medium',
    reward: 50,
    companies: ['Google', 'Goldman Sachs'],
    question: 'In a country every family continues having children until they have a boy, then they stop. What is the expected ratio of boys to girls in the country?',
    hint: 'Each family has exactly 1 boy. Expected number of girls per family = 0×(1/2) + 1×(1/4) + 2×(1/8) + … = 1.',
    answer: 'Each family has exactly one boy. Expected girls per family = 0(1/2) + 1(1/4) + 2(1/8) + 3(1/16) + … = 1. So ratio boys : girls = 1 : 1 (50–50).',
    verification_question: 'What is the expected ratio of boys to girls in the country?',
    verification_options: ['More boys than girls', '1 : 1 (50–50)', 'More girls than boys', '2 : 1 boys to girls'],
    verification_answer: 1
  },
  {
    id: 'maximum-chocolates',
    title: 'Maximum Chocolates',
    category: 'mathematical',
    difficulty: 'medium',
    reward: 45,
    companies: ['Infosys', 'MakeMyTrip'],
    question: 'You have 15 rupees. One chocolate costs 1 rupee, and you get 1 wrapper free for every 3 wrappers. How many chocolates can you get in total?',
    hint: 'Buy 15 chocolates (15 wrappers). Exchange 12 wrappers for 4 more (4 wrappers left). Exchange 3 for 1 more (2 wrappers). Total 15+4+1 = 20; 2 wrappers left.',
    answer: '15 rupees → 15 chocolates, 15 wrappers. 15 wrappers → 5 new chocolates, 5 wrappers. 3 of those wrappers → 1 more chocolate, 3 wrappers left (1+2). Total: 15+5+1 = 21 chocolates (and 3 wrappers if you need exact formulation).',
    verification_question: 'With 15 rupees and 3 wrappers = 1 chocolate, how many chocolates can you get in total?',
    verification_options: ['18', '20', '21', '22'],
    verification_answer: 2
  },
  {
    id: 'snail-and-wall',
    title: 'Snail and Wall',
    category: 'mathematical',
    difficulty: 'easy',
    reward: 30,
    companies: ['TCS'],
    question: 'A snail climbs a 10 m wall. Each day it climbs 3 m and each night it slips 2 m. On which day does it reach the top?',
    hint: 'After 7 days it has climbed 7 m (net 1 m per day for 7 days). On day 8 it climbs 3 m and reaches 10 m.',
    answer: 'Net progress per day = 1 m. After 7 days it is at 7 m. On the 8th day it climbs 3 m and reaches 10 m. So it reaches the top on day 8.',
    verification_question: 'On which day does the snail reach the top of the 10 m wall?',
    verification_options: ['Day 5', 'Day 7', 'Day 8', 'Day 10'],
    verification_answer: 2
  },
  {
    id: 'prisoner-and-policeman',
    title: 'Prisoner and Policeman',
    category: 'logical',
    difficulty: 'medium',
    reward: 45,
    companies: ['Microsoft'],
    question: 'A prisoner is in the centre of a circular prison of radius 1. A policeman is on the boundary. The prisoner can run at speed 1; the policeman at speed 4. Can the prisoner escape?',
    hint: 'The prisoner can run in a spiral or keep the policeman opposite. If the prisoner runs to a point at distance r from centre, they need to cover distance r; the policeman must run πr. So if r < π/4 the prisoner can reach the boundary before the policeman.',
    answer: 'Yes. The prisoner runs straight toward a point on the boundary. They travel distance 1. The policeman must run along the arc of length π. At speed 4 the policeman takes time π/4; the prisoner takes time 1. Since 1 < π/4, the prisoner reaches the boundary first and escapes.',
    verification_question: 'Can the prisoner escape?',
    verification_options: ['No, the policeman is faster', 'Yes, the prisoner reaches the boundary first', 'Only if the prisoner runs in a spiral', 'It depends on the starting position'],
    verification_answer: 1
  },
  {
    id: 'blind-games',
    title: 'Blind Games',
    category: 'logical',
    difficulty: 'hard',
    reward: 55,
    companies: ['Bloomberg'],
    question: 'There are 100 closed lockers. Person 1 toggles every locker; person 2 toggles every 2nd; person 3 every 3rd; …; person 100 toggles the 100th. Which lockers are open at the end?',
    hint: 'Locker n is toggled once per divisor of n. It ends open only if the number of divisors is odd—i.e. n is a perfect square.',
    answer: 'Locker n is toggled by person d for each divisor d of n. So it is toggled an odd number of times iff n has an odd number of divisors, i.e. n is a perfect square. So lockers 1, 4, 9, 16, 25, 36, 49, 64, 81, 100 are open.',
    verification_question: 'Why do only perfect square numbered lockers remain open?',
    verification_options: ['They are toggled an odd number of times', 'They are toggled exactly twice', 'They are toggled only once', 'They are never toggled'],
    verification_answer: 0
  },
  {
    id: 'strategy-2-player-coin-game',
    title: 'Strategy for a 2-Player Coin Game',
    category: 'logical',
    difficulty: 'medium',
    reward: 45,
    companies: ['TCS'],
    question: 'Coins are in a line. Two players take turns; each may take 1 or 2 coins from one end. The player who takes the last coin wins. If you go first and both play optimally, do you want an even or odd number of coins to start?',
    hint: 'With 1 or 2 coins the first player wins. With 3 coins the first player loses (whatever they take, the second takes the rest). So 3 is a losing position; 4 and 5 are winning (you leave 3).',
    answer: 'With n coins, the first player wins if n is not a multiple of 3. So you want the initial number of coins not divisible by 3. If it is divisible by 3, the second player can always force a win.',
    verification_question: 'If you go first, when do you want to avoid the initial number of coins?',
    verification_options: ['When it is odd', 'When it is divisible by 3', 'When it is even', 'When it is prime'],
    verification_answer: 1
  },
  {
    id: 'minimum-cuts',
    title: 'Minimum Cuts',
    category: 'logical',
    difficulty: 'medium',
    reward: 40,
    companies: ['Amazon'],
    question: 'What is the minimum number of cuts needed to cut a cube into 27 smaller equal cubes (3×3×3)?',
    hint: 'You can stack pieces. Cut to get 3 slices in one direction (2 cuts), then 3 in another (2 cuts), then 3 in the third (2 cuts).',
    answer: '6 cuts. Two cuts per axis: first two cuts split the cube into 3 slabs, next two into 9 columns, next two into 27 cubes. So 2+2+2 = 6 cuts.',
    verification_question: 'Why are two cuts needed along each axis to form 27 small cubes?',
    verification_options: ['Because each dimension must be split into three layers', 'Because cubes require six faces', 'Because the cube is symmetric', 'Because cutting diagonally is impossible'],
    verification_answer: 0
  },
  {
    id: 'hourglasses',
    title: 'Hourglasses',
    category: 'mathematical',
    difficulty: 'medium',
    reward: 45,
    companies: ['Bank of America', 'Yahoo'],
    question: 'You have two hourglasses: one runs 7 minutes, one runs 4 minutes. How do you measure exactly 9 minutes?',
    hint: 'Start both. When 4 runs out, flip it (7 has 3 left). When 7 runs out, flip 4 (3 min left in 4). When 4 runs out, 3+4+2 or similar—refine to get 9.',
    answer: 'Start both. When 4-min ends, flip it (7 has 3 min left). When 7-min ends, flip 4 again (it has 3 min to run). When 4-min ends the second time, 7+2 = 9 minutes have passed. (Alternatively: 4+4+1 from 7, etc., depending on exact interpretation.)',
    verification_question: 'Why does flipping the 4-minute hourglass when the 7-minute one ends help measure 9 minutes?',
    verification_options: ['Because the remaining sand measures the final time interval', 'Because hourglasses reset automatically', 'Because the sand flows faster', 'Because both hourglasses synchronize'],
    verification_answer: 0
  },
  {
    id: 'four-people-rickety-bridge',
    title: 'Four People on a Rickety Bridge',
    category: 'mathematical',
    difficulty: 'hard',
    reward: 60,
    companies: ['Jumbotail', 'SAP'],
    question: 'Four people must cross a bridge at night. One flashlight. Bridge holds at most 2. Speeds: 1, 2, 5, 10 min. What is the minimum time to get all across?',
    hint: 'Same idea as "Torch and Bridge": 1 and 2 cross; 1 returns; 5 and 10 cross; 2 returns; 1 and 2 cross. Total 17 min.',
    answer: '1 and 2 cross (2 min). 1 returns (1 min). 5 and 10 cross (10 min). 2 returns (2 min). 1 and 2 cross (2 min). Total: 17 minutes.',
    verification_question: 'Why should the two slowest people cross together in the optimal strategy?',
    verification_options: ['To avoid multiple slow crossings', 'Because they carry the torch', 'Because they must cross first', 'Because they cannot walk alone'],
    verification_answer: 0
  },
  {
    id: 'circle-of-lights',
    title: 'The Circle of Lights',
    category: 'logical',
    difficulty: 'hard',
    reward: 55,
    companies: ['Microsoft', 'Bloomberg'],
    question: 'There are 100 light bulbs in a circle, all initially off. Person 1 flips every bulb; person 2 flips every 2nd; …; person 100 flips every 100th. Which bulbs are on at the end?',
    hint: 'Same as "Blind Games": bulb n is toggled by person d for each divisor d of n. Odd toggles ⇔ n is a perfect square.',
    answer: 'Bulb n is toggled once for each divisor of n. So it is on iff n has an odd number of divisors, i.e. n is a perfect square: 1, 4, 9, 16, 25, 36, 49, 64, 81, 100.',
    verification_question: 'Why do bulbs numbered as perfect squares remain ON at the end?',
    verification_options: ['They have an odd number of divisors', 'They are toggled only once', 'They are never toggled', 'They are toggled exactly twice'],
    verification_answer: 0
  },
  {
    id: 'injection-anesthesia',
    title: 'Injection for Anesthesia',
    category: 'logical',
    difficulty: 'medium',
    reward: 45,
    companies: ['Google', 'Yahoo'],
    question: 'A doctor has 5 bottles of medicine. One is contaminated and causes a reaction in 24 hours. He has 3 mice and one 24-hour window to run tests. How does he identify the contaminated bottle?',
    hint: 'Label bottles 0–4. Use 3 mice as 3 bits. Mouse i gets bottle j if bit i of j is 1. Which mice die gives the bottle number in binary.',
    answer: 'Number bottles 0–4 (3 bits: 000 to 100). Mouse 0 gets bottles 1,3; mouse 1 gets bottles 2,3; mouse 2 gets bottle 4. After 24 hours, the pattern of which mice died gives the binary representation of the contaminated bottle (0–5).',
    verification_question: 'Why can binary encoding identify the contaminated bottle in one round of tests?',
    verification_options: ['Each mouse represents a binary digit', 'Binary numbers are easier to read', 'Binary reduces poison effects', 'Binary tests faster'],
    verification_answer: 0
  },
  { id: 'cheating-husband', title: 'Cheating Husband', category: 'logical', difficulty: 'hard', reward: 55, companies: ['Microsoft', 'Google'], question: 'In a town where every wife knows immediately when another woman\'s husband cheats (but not her own), and no one talks, the queen announces that at least one husband has cheated. What happens?', hint: 'Consider the case with 1 cheater, then 2, then n. Use induction.', answer: 'All husbands are executed on the nth day if n cheated. If 1 cheated, his wife sees no other cheaters and deduces it is hers on day 1. If 2 cheated, each wife sees one cheater; when no one acts day 1, both deduce and act day 2, etc.', verification_question: 'Why do the wives act on the nth day when n husbands cheated?', verification_options: ['They all guess randomly', 'Each wife observes others and deduces information by elimination', 'They are told directly', 'They use voting'], verification_answer: 1 },
  { id: 'chameleons-on-a-date', title: 'Chameleons Go on a Date', category: 'logical', difficulty: 'medium', reward: 45, companies: ['Amazon'], question: 'On an island, 13 green, 15 blue, and 17 red chameleons live. When two of different colors meet, they both turn the third color. Can all chameleons ever be the same color?', hint: 'Consider the remainders of the counts modulo 3 when meetings happen.', answer: 'No. The differences between any two color counts modulo 3 are invariant. Initially (13,15,17) gives differences that are not all 0 mod 3. For all same color, two counts must be 0, so the invariant would require 0 mod 3—contradiction.', verification_question: 'Why can the chameleons never all become the same color?', verification_options: ['Because chameleons refuse to change color', 'Because the difference between color counts modulo 3 remains invariant', 'Because colors cannot mix', 'Because meetings stop after some time'], verification_answer: 1 },
  { id: 'cheryls-birthday', title: "Cheryl's Birthday", category: 'logical', difficulty: 'hard', reward: 60, companies: ['Facebook', 'WhatsApp'], question: 'Albert and Bernard become friends with Cheryl. She gives them a list of 10 dates. She tells Albert the month and Bernard the day. They have a short conversation and then both know the exact date. What is Cheryl\'s birthday?', hint: 'Dates with unique days eliminate months. Then unique month reveals the date.', answer: 'July 16. After "I don\'t know" and "I didn\'t know but now I do," the only date with a unique day that remains is July 16.', verification_question: 'What key reasoning step allowed Albert and Bernard to determine the date?', verification_options: ['Eliminating impossible months and days using the conversation', 'Guessing the most common date', 'Choosing the earliest date', 'Checking leap years'], verification_answer: 0 },
  { id: 'lion-and-unicorn', title: 'The Lion and the Unicorn', category: 'logical', difficulty: 'medium', reward: 45, companies: ['TCS', 'The Access Group'], question: 'The lion lies on Mon/Tue/Wed, the unicorn on Thu/Fri/Sat; both tell truth on the other days. Lion says "Yesterday I lied." Unicorn says "So did I." What day is it?', hint: 'Check each day: when can the lion say that, and when can the unicorn say "So did I"?', answer: 'Thursday. On Thu the lion lied Wed (true statement). On Thu the unicorn tells truth and also lied Wed. So both statements hold.', verification_question: 'Why must the correct day satisfy both the lion\'s and unicorn\'s statements?', verification_options: ['Because their truth/lie schedules determine valid days', 'Because animals always tell the truth', 'Because the puzzle allows only one day', 'Because the guards communicate secretly'], verification_answer: 0 },
  { id: 'blind-man-and-pills', title: 'Blind Man and Pills', category: 'logical', difficulty: 'medium', reward: 45, companies: ['Mentor Graphics'], question: 'A blind man has two types of pills (A and B), 4 of each. They are identical except A is heavy and B is light. He must take 1 A and 1 B daily. How does he do it with a balance scale?', hint: 'Weigh 1 pill from one group against 1 from the other. Then split and use the scale to identify one of each type.', answer: 'Weigh 3A vs 3B. If equal, the remaining 1A and 1B are the pair. If not, the heavier side has more A; take one from heavy and one from light, then use one more weighing to confirm which is A and which is B for the rest.', verification_question: 'Why does using the balance scale help identify the pill types?', verification_options: ['The heavier pills reveal their type by weight comparison', 'The pills dissolve differently', 'The scale shows pill color', 'The scale identifies medicine'], verification_answer: 0 },
  { id: 'burning-candles', title: 'The Burning Candles', category: 'mathematical', difficulty: 'medium', reward: 45, companies: ['Wipro', 'IBM', 'TCS'], question: 'You have two identical candles. Each burns for 60 minutes unevenly (half length might burn in 10 or 50 min). How do you measure 45 minutes?', hint: 'Light one from both ends and one from one end. When the first finishes, 30 min have passed.', answer: 'Light candle 1 from both ends and candle 2 from one end. When candle 1 is gone (30 min), light candle 2 from the other end. It has 30 min left; half of that is 15 min. Total 30+15=45 min.', verification_question: 'Why does lighting a candle from both ends halve the total burn time?', verification_options: ['The flame burns toward the center from both sides', 'The candle burns evenly', 'The wax melts faster', 'The candle becomes shorter'], verification_answer: 0 },
  { id: 'rat-poisonous-milk', title: 'Rat and Poisonous Milk Bottles', category: 'mathematical', difficulty: 'hard', reward: 60, companies: ['Google'], question: 'You have 1000 bottles of milk; one is poisoned. A rat dies in 24 hours if it drinks poison. You have 10 rats. How do you find the poisoned bottle in 24 hours?', hint: 'Label bottles 0–999 in binary. Each rat represents one bit.', answer: 'Number bottles 0–999 in binary (10 bits). Rat i drinks from every bottle with bit i = 1. Which rats die after 24 hours gives the 10-bit number of the poisoned bottle.', verification_question: 'Why are binary numbers useful in solving this puzzle?', verification_options: ['They uniquely identify bottles using rat deaths', 'They reduce poison', 'They make counting easier', 'They reduce rats needed'], verification_answer: 0 },
  { id: 'measuring-6l-water', title: 'Measuring 6L Water from 4L and 9L Buckets', category: 'logical', difficulty: 'medium', reward: 45, companies: ['Microsoft'], question: 'You have a 4L and a 9L bucket and unlimited water. How do you measure exactly 6L?', hint: 'Fill 9L, pour 4L twice into the 4L bucket (leave 1L in 9L). Empty 4L, pour 1L from 9L into 4L, fill 9L, pour from 9L into 4L (3L). 9L now has 6L.', answer: 'Fill 9L. Pour to 4L (5L in 9L). Empty 4L, pour 4L from 9L (1L in 9L). Empty 4L, pour 1L into 4L. Fill 9L, pour from 9L into 4L until 4L full (3L in). 9L has 6L left.', verification_question: 'What key technique is used to measure exact quantities with jugs?', verification_options: ['Repeated filling and pouring between jugs', 'Measuring visually', 'Estimating volume', 'Using equal splits'], verification_answer: 0 },
  { id: 'six-houses-pqrstu', title: 'Six Houses P, Q, R, S, T, and U', category: 'logical', difficulty: 'hard', reward: 55, companies: ['CAT'], question: 'Six houses in a row. Various constraints: P is next to Q, R is left of S, T is at an end, etc. Who lives where?', hint: 'Draw a row and place constraints one by one. Use "at end" and "left of" to fix positions.', answer: 'Solution depends on exact constraints given. Typically: list all constraints, place T at end 1 or 6, then fill R–S order and P–Q adjacency to get a unique ordering.', verification_question: 'What strategy is used to solve arrangement puzzles like this?', verification_options: ['Placing constraints step-by-step in a table or diagram', 'Guessing randomly', 'Choosing alphabetical order', 'Using probability'], verification_answer: 0 },
  { id: 'melting-candles', title: 'Melting Candles', category: 'mathematical', difficulty: 'medium', reward: 45, companies: ['FAANG'], question: 'Two candles of equal length burn in 6 and 4 hours. At what time was one candle twice the height of the other if both were lit at the same time?', hint: 'Set length L. Heights as functions of t: L(1-t/6) and L(1-t/4). Set one equal to twice the other and solve for t.', answer: 'Let L=1. Heights: h1=1-t/6, h2=1-t/4. Set h1=2*h2 or h2=2*h1. 1-t/6=2(1-t/4) gives t/6=2t/4-1, t=3 hours. Or 1-t/4=2(1-t/6) gives t=2.4 hours. So 3h or 2.4h depending on which is twice which.', verification_question: 'Why are algebraic equations used in solving this puzzle?', verification_options: ['To model candle heights as functions of time', 'To count candles', 'To estimate burn rate visually', 'To reduce calculation'], verification_answer: 0 },
  { id: 'red-hat-vs-blue-hat', title: 'Red Hat vs Blue Hat', category: 'logical', difficulty: 'medium', reward: 50, companies: ['Microsoft'], question: 'N people in a line, each with a red or blue hat. Each sees only the hats in front. From the back, each guesses their own hat color. What strategy maximizes correct guesses?', hint: 'The last person can encode parity (even/odd red) with their guess. Others decode and deduce their own color.', answer: 'Last person says "red" if they see even number of red hats, "blue" if odd. Each subsequent person counts red in front and compares with the parity already communicated to deduce their own hat.', verification_question: 'Why does the last person encode parity in their guess?', verification_options: ['To communicate information about hats to the others', 'To confuse the guards', 'To guess randomly', 'To shorten the line'], verification_answer: 0 },
  { id: 'joint-family-seven', title: 'Joint Family of Seven Persons (L, M, N, O, P, Q, R)', category: 'logical', difficulty: 'hard', reward: 55, companies: ['TCS'], question: 'Seven people with constraints: who is married to whom, who is whose parent, etc. Determine the full family tree.', hint: 'List all given relations. Start with definite ones (e.g. M is R\'s father) and build the tree.', answer: 'Depends on exact problem. Typically: build a tree from "parent of" and "spouse of" constraints; resolve ambiguities using "only one" or "elder" type clues.', verification_question: 'What reasoning method is most useful for solving family relationship puzzles?', verification_options: ['Constructing a relationship diagram', 'Random guessing', 'Alphabetical ordering', 'Voting'], verification_answer: 0 },
  { id: '9-students-red-black-hats', title: '9 Students and Red/Black Hats', category: 'logical', difficulty: 'medium', reward: 50, companies: ['Google'], question: '9 students in a row, each with a red or black hat. Each sees the hats in front. They guess from the back. What strategy ensures at most one wrong guess?', hint: 'Same as 100 prisoners: use the last student\'s guess to encode parity of red hats they see.', answer: 'Last student says the color that makes the total red count (what they see + their guess) even. Others deduce their hat from the running parity. At most the last can be wrong.', verification_question: 'What idea ensures only one student may guess incorrectly?', verification_options: ['Parity encoding of hat colors', 'Majority voting', 'Random guessing', 'Sequential guessing'], verification_answer: 0 },
  { id: 'light-all-the-bulbs', title: 'Light All the Bulbs', category: 'logical', difficulty: 'hard', reward: 55, companies: ['Microsoft', 'Bloomberg'], question: 'N bulbs in a row, all off. Each switch toggles a contiguous segment. What is the minimum number of switches to turn all on?', hint: 'Think of the state as a binary string. Each operation flips a substring. Greedy from the left: flip when you see 0.', answer: 'Minimum is the number of 0-runs. Start from left; whenever you see 0, flip from that position to the end of that 0-run. So answer = number of blocks of consecutive 0s.', verification_question: 'Why does counting blocks of consecutive OFF bulbs determine the minimum switches needed?', verification_options: ['Each block of OFF bulbs requires one toggle operation', 'Switches control single bulbs', 'Bulbs toggle automatically', 'Bulbs cannot be toggled twice'], verification_answer: 0 },
  { id: 'distribute-the-water', title: 'Distribute the Water', category: 'mathematical', difficulty: 'medium', reward: 45, companies: ['Microsoft'], question: 'You have 3 jugs of capacities 8, 5, 3 litres. The 8L is full. How do you get exactly 4L in the 8L jug?', hint: 'Similar to water jug: 8→5 (3,5,0), 5→3 (3,2,3), 3→8 (6,2,0), 5→3 (6,0,2), 8→5 (1,5,2), 5→3 (1,4,3). Now 5L has 4.', answer: '8L full. Pour 8→5: (3,5,0). 5→3: (3,2,3). 3→8: (6,2,0). 5→3: (6,0,2). 8→5: (1,5,2). 5→3: (1,4,3). The 5L jug now has 4L.', verification_question: 'What key technique allows measuring exact quantities using water jugs?', verification_options: ['Estimating visually', 'Repeated pouring between containers', 'Using equal splits', 'Measuring by weight'], verification_answer: 1 },
  { id: 'two-hairs-same-number', title: 'Can 2 Persons Have Same Number of Hairs?', category: 'logical', difficulty: 'easy', reward: 35, companies: ['OPPO'], question: 'Can two people have exactly the same number of hairs on their head?', hint: 'Pigeonhole principle. How many possible values of "number of hairs"? How many people?', answer: 'Yes. Humans have at most about 150,000 hairs. So there are at most 150,001 possible values (0 to 150000). With millions of people, by pigeonhole principle at least two have the same count.', verification_question: 'Which mathematical principle explains why two people must share the same number of hairs?', verification_options: ['Pigeonhole Principle', 'Binary Search', 'Probability Theory', 'Modular Arithmetic'], verification_answer: 0 },
  { id: 'weight-heavy-ball', title: 'Weight of Heavy Ball', category: 'mathematical', difficulty: 'medium', reward: 45, companies: ['IBM'], question: 'You have 12 identical-looking balls. One is heavier. Using a balance scale 3 times, find the heavy ball.', hint: 'First weighing: 4 vs 4. If equal, heavy is in the remaining 4; then 1 vs 1.', answer: 'Weigh 4 vs 4. If equal, heavy is in remaining 4: weigh 1 vs 1 of those; if equal, weigh one of the last 2 vs a known good; else the heavier side has it. If 4 vs 4 unequal, take the heavier 4 and weigh 2 vs 2; then 1 vs 1.', verification_question: 'Why does dividing balls into groups help identify the heavy ball efficiently?', verification_options: ['It reduces possibilities after each weighing', 'It balances the scale', 'It increases measurement accuracy', 'It reduces ball movement'], verification_answer: 0 },
  { id: '6x6-grid-how-many-ways', title: '6×6 Grid: How Many Ways?', category: 'mathematical', difficulty: 'medium', reward: 50, companies: ['Amazon', 'Zoho'], question: 'In a 6×6 grid, how many ways can you go from top-left to bottom-right moving only right or down?', hint: 'You need 5 rights and 5 downs. So count arrangements of RRRRRDDDDD.', answer: 'You must take 5 steps right and 5 steps down. Number of paths = C(10,5) = 252 (or C(10,5) for 5+5=10 steps, choose 5 positions for R).', verification_question: 'Why does the number of grid paths equal a combination formula?', verification_options: ['Each path is an arrangement of right and down moves', 'Grid cells are symmetric', 'Paths cannot overlap', 'Every path has equal length'], verification_answer: 0 },
  { id: 'maximize-probability-white-ball', title: 'Maximize Probability of White Ball', category: 'mathematical', difficulty: 'hard', reward: 55, companies: ['Amazon'], question: 'Two bags: one has 1 white and 1 black; the other has 1 white and 2 black. You pick a bag at random and draw a ball. How do you maximize the chance of drawing white?', hint: 'You can move balls between bags before choosing. What if you put one white in one bag and the rest in the other?', answer: 'Put 1 white in bag 1 and the other white + all blacks in bag 2. Pick bag 1 with prob 1/2: get white. Pick bag 2: P(white)=1/4. Total P(white)=1/2+1/2*1/4=5/8. Better than 1/2.', verification_question: 'Why does placing one white ball in a separate bag increase probability?', verification_options: ['It guarantees success if that bag is chosen', 'It reduces the number of black balls', 'It increases total balls', 'It changes probability rules'], verification_answer: 0 },
  { id: 'car-wheel-puzzle', title: 'Car Wheel Puzzle', category: 'mathematical', difficulty: 'medium', reward: 40, companies: ['MakeMyTrip'], question: 'A car wheel has 4 spokes. How many ways can you color the 4 sections with 2 colors (rotations considered same)?', hint: 'Burnside\'s lemma or count: all same (2), three same one diff (2), two-two (2), all diff (1).', answer: 'Using Burnside: identity 16, rotate 90° gives 2, 180° gives 4, 270° gives 2. (16+2+4+2)/4 = 6 distinct colorings.', verification_question: 'Why must rotational symmetry be considered when counting colorings?', verification_options: ['Rotations can create identical color patterns', 'Rotations change colors', 'Rotations change wheel shape', 'Rotations increase possibilities'], verification_answer: 0 },
  { id: 'splitting-cake-missing-piece', title: 'Splitting a Cake with a Missing Piece', category: 'shape', difficulty: 'hard', reward: 55, companies: ['Alcatel-Lucent', 'Cognizant'], question: 'A circular cake has one rectangular piece removed. How do you cut the remainder into two equal areas with one straight cut?', hint: 'The cut must pass through the centre of the original circle. The line through the centre bisects both the circle and (if chosen correctly) the "missing" area.', answer: 'Draw the line through the centre of the original circle and the centre of the missing rectangle. That line bisects both the full circle and the removed part, so the two remaining pieces are equal.', verification_question: 'Why does cutting through the circle\'s center divide the cake equally?', verification_options: ['A diameter splits the circle into equal areas', 'All cakes are symmetric', 'The missing piece is small', 'Cuts must be straight'], verification_answer: 0 },
  { id: 'rs-500-note', title: 'Rs 500 Note Puzzle', category: 'mathematical', difficulty: 'medium', reward: 45, companies: ['CAT', 'UPSC'], question: 'How can you make exactly Rs 500 using only Rs 1, Rs 2, and Rs 5 coins? Find the number of ways.', hint: 'Let a,b,c be counts of 1,2,5. a+2b+5c=500. Fix c, then count (a,b) with a+2b=500-5c, a>=0, b>=0.', answer: 'For each c from 0 to 100, we need a+2b=500-5c with a,b>=0. So b can be 0 to floor((500-5c)/2), and a is determined. Sum over c gives the total number of ways.', verification_question: 'Why is the equation a + 2b + 5c = 500 used in this puzzle?', verification_options: ['It represents total value using coin counts', 'It represents coin weight', 'It counts total coins', 'It calculates probability'], verification_answer: 0 },
  { id: 'girl-or-boy', title: 'Girl or Boy', category: 'mathematical', difficulty: 'medium', reward: 45, companies: ['Amazon'], question: 'A family has two children. You learn one is a girl. What is the probability both are girls?', hint: 'Sample space: GG, GB, BG, BB. Given "at least one girl", we have GG, GB, BG. So P(both girls)=1/3.', answer: 'Given at least one girl, the equally likely outcomes are GG, GB, BG. So P(both girls) = 1/3. (Not 1/2, because we did not specify which child is the girl.)', verification_question: 'Why is the probability of two girls equal to 1/3 instead of 1/2?', verification_options: ['Three equally likely outcomes remain after conditioning', 'Two outcomes are impossible', 'Probability changes with age', 'Children are independent'], verification_answer: 0 },
  { id: 'know-average-salary', title: 'Know Average Salary Without Disclosing Individual Salaries', category: 'mathematical', difficulty: 'hard', reward: 55, companies: ['Infosys', 'Bloomberg'], question: 'N people want to know the average salary without anyone revealing their own. How do they do it?', hint: 'First person adds a random number to their salary and passes. Each adds their salary and passes. Last subtracts the random number and divides by N.', answer: 'Person 1 adds random R to their salary S1, passes S1+R to person 2. Person 2 adds S2, passes S1+S2+R. Continue. Last person gets sum+R, subtracts R (person 1 tells them), divides by N for average.', verification_question: 'Why does adding a random number protect individual salaries?', verification_options: ['It hides the first person\'s actual salary', 'It reduces the total', 'It randomizes the average', 'It prevents calculation'], verification_answer: 0 },
  { id: 'maximum-run-cricket', title: 'Maximum Run in Cricket', category: 'mathematical', difficulty: 'medium', reward: 45, companies: ['FAANG'], question: 'In one over (6 balls), what is the maximum runs without extras? (Assume standard runs 0–6 per ball.)', hint: 'Maximum per ball is 6. But there are rules about running between wickets.', answer: 'If each ball can score at most 6 (and no running between wickets for more than 6), max = 6*6 = 36 in the over. With running, theoretically 6+5+4+3+2+1 or similar patterns can be argued; typically answer given as 36.', verification_question: 'Why is 36 the maximum possible score in a normal over?', verification_options: ['Six balls × maximum six runs each', 'Players cannot run more', 'Cricket rules limit scoring', 'Overs contain six batters'], verification_answer: 0 },
  { id: 'completion-of-task', title: 'Completion of Task', category: 'mathematical', difficulty: 'medium', reward: 40, companies: ['Reflexis'], question: 'A and B complete a task in 12 days. A alone takes 20 days. How long does B alone take?', hint: '1/A + 1/B = 1/12, 1/A = 1/20. So 1/B = 1/12 - 1/20 = (5-3)/60 = 2/60 = 1/30.', answer: '1/20 + 1/B = 1/12, so 1/B = 1/12 - 1/20 = 1/30. B takes 30 days alone.', verification_question: 'Why are work problems solved using rates like 1/A + 1/B?', verification_options: ['Work rates represent fraction of work completed per unit time', 'Workers share tasks equally', 'Tasks are divided randomly', 'Rates measure time directly'], verification_answer: 0 },
  { id: 'find-missing-row-excel', title: 'Find Missing Row in Excel', category: 'logical', difficulty: 'medium', reward: 45, companies: ['Philips'], question: 'An Excel sheet has rows 1 to N with one row missing. You can only read one cell at a time. How do you find the missing row in O(log N) reads?', hint: 'Use binary search on the row index. Check if the value at mid row equals the expected value.', answer: 'Binary search: check row N/2. If cell value equals expected (e.g. row number), missing is in upper half; else lower half. Recurse. O(log N) reads.', verification_question: 'Why does binary search find the missing row efficiently?', verification_options: ['It halves the search space each step', 'It checks every row', 'It sorts the rows', 'It guesses randomly'], verification_answer: 0 },
  { id: 'man-fell-in-well', title: 'Man Fell in Well', category: 'mathematical', difficulty: 'easy', reward: 35, companies: ['American Express'], question: 'A man climbs out of a 20m well. Each day he climbs 5m and each night slips 3m. When does he get out?', hint: 'After 8 days he is at 16m. On day 9 he climbs 5m and reaches 21m, so he is out.', answer: 'Net +2m per day. After 8 days he is at 16m. On day 9 he climbs 5m to 21m and is out. So 9 days.', verification_question: 'Why does the man escape before slipping on the final day?', verification_options: ['He reaches the top during the day\'s climb', 'The wall becomes shorter', 'He climbs faster', 'Night slipping stops'], verification_answer: 0 },
  { id: 'form-three-equilateral-triangles', title: 'Form Three Equilateral Triangles', category: 'shape', difficulty: 'hard', reward: 55, companies: ['Google'], question: 'You have 6 matchsticks of equal length. How do you form 3 equilateral triangles?', hint: 'Use a triangular pyramid (tetrahedron base): 6 edges can form 4 triangles. Or 2D: share sides.', answer: 'Arrange as a triangular pyramid (tetrahedron): 4 vertices, 6 edges, 4 faces—each face is an equilateral triangle. So 4 triangles, or in 2D use 6 sticks to form 2 triangles sharing one side and one triangle beside.', verification_question: 'Why does arranging matchsticks in 3D form multiple triangles?', verification_options: ['Edges can form faces of a tetrahedron', 'Matchsticks bend easily', 'Triangles overlap', 'Triangles merge together'], verification_answer: 0 },
  { id: '10-identical-bottles-pills', title: '10 Identical Bottles of Pills', category: 'logical', difficulty: 'medium', reward: 50, companies: ['ZS Associate'], question: '10 bottles of pills, one has pills that are 1.1g (others 1g). One weighing on a scale. Find the heavy bottle.', hint: 'Take 1 from bottle 1, 2 from bottle 2, ..., 10 from bottle 10. Weigh. Excess weight/0.1 = bottle number.', answer: 'Take 1,2,...,10 pills from bottles 1–10. Total weight if all 1g = 55g. Actual weight minus 55 = 0.1*k, so k = bottle number.', verification_question: 'Why does taking increasing numbers of pills identify the heavier bottle?', verification_options: ['The extra weight reveals the bottle index', 'The pills mix together', 'The scale counts pills', 'Pills dissolve differently'], verification_answer: 0 },
  { id: 'maximum-pieces-6-lines', title: 'Maximum Pieces from Circle with 6 Straight Lines', category: 'shape', difficulty: 'medium', reward: 45, companies: ['TCS'], question: 'What is the maximum number of pieces you can get by cutting a circle with 6 straight lines?', hint: 'n lines: max pieces = 1 + n(n+1)/2. For 6: 1+21=22.', answer: 'Maximum pieces = 1 + 1+2+...+n = 1 + n(n+1)/2. For n=6: 1+21 = 22 pieces.', verification_question: 'Why does the formula 1 + n(n+1)/2 give maximum pieces?', verification_options: ['Each new line intersects previous lines', 'Lines divide circles equally', 'Lines overlap perfectly', 'Circles double pieces'], verification_answer: 0 },
  { id: 'chain-link-puzzle', title: 'Chain Link Puzzle', category: 'mathematical', difficulty: 'medium', reward: 45, companies: ['Cognizant'], question: 'You have 5 pieces of chain of 3 links each. What is the minimum number of links to open and reclose to join all into one loop?', hint: 'Opening one link in one piece lets you connect two pieces. So open 3 links (each from a different piece) and use them to connect the 5 pieces.', answer: 'Open 3 links (e.g. one from each of 3 pieces). Use those 3 open links to connect the 5 segments: 3 cuts and 3 reconnects form one loop. So 3.', verification_question: 'Why is opening three links enough to join all chains?', verification_options: ['Each open link connects two segments', 'Chains are symmetric', 'Links expand automatically', 'Chains shrink when opened'], verification_answer: 0 },
  { id: 'shopkeeper-fake-note', title: 'Shopkeeper and Lady with Fake Note', category: 'mathematical', difficulty: 'medium', reward: 45, companies: ['Persistent'], question: 'A lady buys something for Rs 200 with a Rs 500 fake note. The shopkeeper gets change from a neighbour. What is the shopkeeper\'s loss?', hint: 'Shopkeeper gave item (cost) + Rs 300 change. He received nothing valid. So loss = cost + 300. If item cost is 0 (free), loss 300.', answer: 'Shopkeeper gave item worth Rs X and Rs 300 change. He received a fake Rs 500. So his loss = X + 300 (assuming he had to reimburse the neighbour).', verification_question: 'Why does the shopkeeper lose both goods and money?', verification_options: ['Because the Rs 500 note was fake', 'Because the item was expensive', 'Because the neighbor cheated', 'Because change was incorrect'], verification_answer: 0 },
  { id: 'two-egg-problem', title: 'The Two-Egg Problem', category: 'mathematical', difficulty: 'hard', reward: 60, companies: ['Google', 'Microsoft'], question: 'Same as 2 eggs and 100 floors: find minimum drops in worst case to find the critical floor.', hint: 'Use first egg to narrow range; second egg for linear search in that range. Optimize the step size (e.g. 14, 27, 39...).', answer: 'Drop first egg from floors 14, 27, 39, 50, 60, 69, 77, 84, 90, 95, 99. When it breaks, use second egg linearly in the interval. Worst case 14 drops.', verification_question: 'Why are drop intervals gradually reduced in this strategy?', verification_options: ['To keep the worst-case number of drops constant', 'To avoid breaking eggs', 'To reduce building height', 'To speed the test'], verification_answer: 0 },
  { id: 'minimum-apples-red', title: 'Minimum Apples to Guarantee M Red', category: 'mathematical', difficulty: 'hard', reward: 55, companies: ['Leetcode'], question: 'There are 3 trees: one has only red apples, one only green, one mixed. You pick one apple per tree. What is the minimum apples to pick to guarantee at least 2 red?', hint: 'Worst case: pick all green from mixed and green tree, then need 2 from red tree. So 0+0+2 + (max from others) = 2 + (N-2) from others?', answer: 'To guarantee 2 red: worst case take 1 from mixed (could be green), 1 from green tree, then 2 from red tree. So minimum = 1+1+2 = 4 apples.', verification_question: 'Why must we consider the worst-case scenario when guaranteeing a certain number of red apples?', verification_options: ['Because we must ensure success even in the least favorable draw', 'Because apples change color randomly', 'Because red apples are heavier', 'Because baskets are identical'], verification_answer: 0 },
  { id: '1000-light-bulbs-1000-people', title: '1000 Light Bulbs and 1000 People', category: 'logical', difficulty: 'medium', reward: 50, companies: ['UK University'], question: '1000 bulbs off. Person i toggles bulbs i, 2i, 3i, ... Which bulbs are on at the end?', hint: 'Bulb n is toggled by each divisor of n. So on iff n has an odd number of divisors = perfect square.', answer: 'Bulb n is toggled once per divisor. So on iff n is a perfect square: 1, 4, 9, ..., 961. Total 31 bulbs on.', verification_question: 'Why do only bulbs numbered as perfect squares remain ON?', verification_options: ['They have an odd number of divisors', 'They are toggled only once', 'They are never toggled', 'They are toggled exactly twice'], verification_answer: 0 },
  { id: 'four-alternating-knights', title: 'Four Alternating Knights', category: 'logical', difficulty: 'hard', reward: 55, companies: ['Amazon', 'Google'], question: 'Four knights on a 3×3 board (two white, two black). Swap the positions of white and black knights in minimum moves. Knights move in L-shape.', hint: 'Graph of possible moves; find shortest path between the two configurations.', answer: 'Minimum 16 moves (or as per specific board setup). Typically: move knights in a cycle so that each reaches the other side; exact sequence depends on initial positions.', verification_question: 'What strategy is used to minimize moves when swapping knight positions?', verification_options: ['Exploring valid moves like a shortest-path search', 'Randomly moving knights', 'Always moving the same knight', 'Mirroring moves blindly'], verification_answer: 0 },
  { id: 'nine-dots', title: 'The Nine Dots', category: 'shape', difficulty: 'medium', reward: 45, companies: ['TCS'], question: 'Nine dots in a 3×3 grid. Connect all 9 with 4 straight lines without lifting the pen.', hint: 'Lines must extend beyond the grid. Think outside the box.', answer: 'Draw one line through top row and extend; one through middle row; one diagonal; one line through remaining dots. Or: 3 lines can suffice if you allow curved or think creatively—classic answer is 4 lines extending past the square.', verification_question: 'Why must lines extend beyond the 3×3 grid to solve the puzzle?', verification_options: ['Because the dots cannot be connected within the square boundary', 'Because dots move outside the grid', 'Because lines must be curved', 'Because the grid rotates'], verification_answer: 0 },
  { id: '100-cows-and-milk', title: '100 Cows and Milk', category: 'mathematical', difficulty: 'medium', reward: 45, companies: ['ZS'], question: 'A farmer has 100 cows. One gives 1L more milk than the rest. You can mix milk from any set. How many measurements to find the special cow?', hint: 'Binary representation: 100 cows need 7 bits. 7 measurements, each: mix milk from cows with bit i = 1.', answer: 'Label 1–100 in binary (7 bits). Measurement i: take milk from all cows with bit i = 1. The excess in each measurement gives the 7-bit number of the special cow. So 7 measurements.', verification_question: 'Why does binary representation help identify the special cow?', verification_options: ['Each measurement encodes a binary bit', 'Binary numbers increase milk production', 'Binary simplifies counting cows', 'Binary reduces measurements'], verification_answer: 0 },
  { id: 'one-mile-on-globe', title: 'One Mile on the Globe', category: 'mathematical', difficulty: 'medium', reward: 45, companies: ['Microsoft'], question: 'You walk one mile south, one mile east, one mile north and are back where you started. Where are you?', hint: 'North Pole is one answer. There are other points near the South Pole where a circle of latitude has circumference 1 mile.', answer: 'North Pole: going south, then east (no change in position at pole), then north back. Or: near South Pole there is a latitude circle of 1 mile; start 1 mile north of it—south to circle, east 1 mile (full lap), north back.', verification_question: 'Why does the North Pole satisfy the walking condition?', verification_options: ['Moving east there does not change position', 'The distance becomes zero', 'The globe rotates', 'The path becomes straight'], verification_answer: 0 },
  { id: 'three-matchsticks-three-squares', title: 'Three Matchsticks to Three Squares', category: 'shape', difficulty: 'easy', reward: 35, companies: ['TCS'], question: 'You have 6 matchsticks. Form 3 squares of the same size. (No breaking sticks.)', hint: 'Share sides. Two squares share one side; third shares with one of them. So 3 squares need 3*4 - 2 - 2 = 8 sides, but we have 6 sticks—so some sticks are shared. 3 squares: 12 edges - 6 shared = 6 sticks.', answer: 'Form a row of 3 squares sharing edges: square1-square2-square3. That uses 3+2+2 = 7 edges? Actually 3 squares = 12 sides, minus 2 shared each = 6 unique. So 6 matchsticks form 3 squares in a line.', verification_question: 'Why do shared sides allow forming multiple squares with fewer matchsticks?', verification_options: ['Edges can belong to more than one square', 'Squares shrink automatically', 'Matchsticks bend easily', 'Squares overlap perfectly'], verification_answer: 0 },
  { id: 'counters-and-board', title: 'The Counters and Board', category: 'arrangement', difficulty: 'medium', reward: 45, companies: ['JP Morgan'], question: 'Place N counters on an N×N board so that no two are in the same row, column, or diagonal. (N-queens type.)', hint: 'Classic N-queens. Backtracking or use known patterns for small N.', answer: 'For N=8 (chessboard), many solutions exist. Place queens so no two attack. Standard backtracking: place in row i, try columns; recurse.', verification_question: 'Why must no two counters share the same row, column, or diagonal?', verification_options: ['Otherwise they attack each other like chess queens', 'Otherwise the board becomes full', 'Otherwise moves are restricted', 'Otherwise pieces overlap'], verification_answer: 0 },
  { id: 'six-matches-right-foot', title: 'Six Matches, Right Foot Forward', category: 'arrangement', difficulty: 'medium', reward: 40, companies: ['TCS'], question: 'Arrange 6 matchsticks to form a shape that looks like "right foot forward."', hint: 'Literal: form a right footprint with 6 sticks—toes, heel, outline.', answer: 'Arrange 6 matches as the outline of a right foot: e.g. 3 for toes, 2 for sides, 1 for heel; or similar creative arrangement.', verification_question: 'What skill is primarily tested in matchstick arrangement puzzles?', verification_options: ['Spatial visualization', 'Arithmetic calculation', 'Probability', 'Sorting algorithms'], verification_answer: 0 },
  { id: 'how-much-initially', title: 'How Much He Had Initially', category: 'mathematical', difficulty: 'medium', reward: 45, companies: ['IAS'], question: 'A man spends 1/3 of his money, then 1/4 of remainder, then 1/5 of remainder. He has Rs 100 left. What did he start with?', hint: 'Work backwards: after 1/5 left he has 100, so before that 100/(4/5)=125. Before 1/4: 125/(3/4). Before 1/3: that/(2/3).', answer: 'After 1/3: 2/3 left. After 1/4 of that: (2/3)(3/4)=1/2 left. After 1/5 of that: (1/2)(4/5)=2/5 left = 100. So total = 100/(2/5)=250.', verification_question: 'Why is working backward useful in this type of puzzle?', verification_options: ['The final amount is known and earlier amounts can be reconstructed', 'Numbers become smaller', 'The fractions cancel automatically', 'The puzzle simplifies randomly'], verification_answer: 0 },
  { id: 'two-creepers-climbing-tree', title: 'Two Creepers Climbing a Tree', category: 'mathematical', difficulty: 'hard', reward: 55, companies: ['Adobe', 'Google', 'Microsoft'], question: 'Two creepers climb a tree. One climbs 3m/day and slips 2m at night; the other 4m/day and slips 3m. When do they meet?', hint: 'Net: 1m/day and 1m/day. Tree height H. They meet when combined progress = H, or when one catches the other. Set positions equal.', answer: 'Creeper 1: net 1m/day. Creeper 2: net 1m/day. If they start same point, they stay together. If different starting points, solve for when heights equal; depends on tree height.', verification_question: 'Why are motion equations used to determine when the creepers meet?', verification_options: ['They describe positions as functions of time', 'They simplify climbing speed', 'They remove slipping', 'They reduce tree height'], verification_answer: 0 },
  { id: 'number-of-legs-in-palace', title: 'Number of Legs in Palace', category: 'mathematical', difficulty: 'medium', reward: 45, companies: ['UnitedLex'], question: 'In a palace, there are people, tables, and cats. Each table has 4 legs; each cat has 4 legs; each person has 2. Total 100 legs. How many people, tables, cats?', hint: 'Multiple solutions. 2P+4T+4C=100. Fix one variable and solve for integer solutions.', answer: 'Many solutions: e.g. 10 tables (40), 10 cats (40), 10 people (20) = 100. Or 25 people (50), 0 tables, 0 cats plus 50/4 not integer—so try 2 people, 12 tables, 12 cats: 4+48+48=100.', verification_question: 'Why can this puzzle have multiple valid solutions?', verification_options: ['Different combinations satisfy the equation', 'Animals change leg counts', 'Tables move around', 'People gain legs'], verification_answer: 0 },
  { id: 'days-of-month-2-dice', title: 'Days of the Month Using 2 Dice', category: 'arrangement', difficulty: 'medium', reward: 45, companies: ['Microsoft'], question: 'You have two dice. How do you represent all dates 01–31 using the two faces (each face one digit)?', hint: 'You need 0,1,2 on both dice (for 01, 02, 11, 22). And 3,4,5,6,7,8,9 on some faces. 6+6=12 faces; need digits 0-9 (10) and 1,2 repeated.', answer: 'One die: 0,1,2,3,4,5. Other: 0,1,2,6,7,8 (use 6 as 9 when flipped). Then 01–09, 10–19, 20–29, 30–31 are all representable.', verification_question: 'Why must digits 0, 1, and 2 appear on both dice?', verification_options: ['They are required to form numbers like 01, 11, and 22', 'They are the most common digits', 'Dice must repeat digits', 'Digits cannot rotate'], verification_answer: 0 },
  { id: 'matchstick-puzzle', title: 'Matchstick Puzzle', category: 'arrangement', difficulty: 'medium', reward: 40, companies: ['Kirloskar', 'SLB'], question: 'Move one matchstick to make the equation correct: e.g. VI = IV + III (Roman numerals).', hint: 'Move one stick from one numeral to another. VI - I = V, or IV + I = V.', answer: 'Depends on given equation. Example: VI = IV + III — move one I from III to IV: VI = V + II, so 6 = 5+1 wrong. Or: change VI to V and IV to VI: 5 = 6 - 1. Vary by puzzle.', verification_question: 'Why can moving a single matchstick change the equation?', verification_options: ['Roman numerals change value with small changes', 'Matchsticks change color', 'Equations rotate', 'Numbers disappear'], verification_answer: 0 },
  { id: 'last-palindrome', title: 'Last Palindrome', category: 'arrangement', difficulty: 'medium', reward: 45, companies: ['Amazon'], question: 'What is the last (largest) palindrome number before 1000?', hint: 'Palindrome: same read forward and backward. 999 is 9-9-9.', answer: '999. It is a palindrome and the largest 3-digit number.', verification_question: 'Why is 999 the largest palindrome below 1000?', verification_options: ['It reads the same forwards and backwards', 'It is divisible by 9', 'It has repeating digits', 'It is the largest 3-digit number'], verification_answer: 0 },
  { id: '10-balls-in-5-lines', title: '10 Balls in 5 Lines', category: 'arrangement', difficulty: 'hard', reward: 50, companies: ['Publicis Sapient'], question: 'Arrange 10 balls in 5 lines of 4 balls each. (Each line has exactly 4 balls.)', hint: 'Think star or pentagon. 5 lines, 10 balls—each ball at intersection of 2 lines? So 5*4/2 = 10 intersection points if each pair of lines meets.', answer: 'Place 5 lines so each line contains 4 of the 10 points. Classic: pentagram (star). The 5 vertices and 5 inner intersections = 10 points; each line of the star goes through 4 points.', verification_question: 'Why does arranging balls in a star shape satisfy the condition?', verification_options: ['Each line intersects multiple points', 'Balls move automatically', 'Lines become curved', 'Balls duplicate themselves'], verification_answer: 0 },
  { id: 'round-table-coin-game', title: 'Round Table Coin Game', category: 'arrangement', difficulty: 'medium', reward: 45, companies: ['ElectrifAi'], question: 'Coins on a round table. Two players take turns taking 1 or 2 adjacent coins. Last to take wins. Strategy?', hint: 'Symmetric strategy: mirror the opponent\'s move with respect to the centre. First player can force win on odd number of coins.', answer: 'With odd total, first player takes the centre coin; then mirrors opponent\'s move (symmetry about centre). So first player wins. With even, second can mirror and win.', verification_question: 'Why does mirroring the opponent\'s move ensure victory?', verification_options: ['It preserves symmetry and forces the opponent into losing positions', 'It doubles the coins', 'It reduces moves', 'It changes the table shape'], verification_answer: 0 },
  { id: 'find-last-ball-remain', title: 'Find the Last Ball to Remain', category: 'other', difficulty: 'medium', reward: 45, companies: ['Times Internet', 'EXL'], question: 'N balls in a row. Repeatedly remove every second ball. Which position remains at the end?', hint: 'Simulate for small N. Pattern: answer is related to the largest power of 2 <= N. 2^m - (N - 2^m)*2 = 2^(m+1) - 2N?', answer: 'For N=2^k the last is position 1. In general, write N = 2^m + L; the last remaining is at position 2*L + 1. (Josephus variant.)', verification_question: 'Why is the Josephus pattern used in this puzzle?', verification_options: ['Balls are removed in a repeating elimination sequence', 'Balls move randomly', 'Balls are sorted', 'Balls change positions'], verification_answer: 0 },
  { id: '100-people-circle-gun', title: '100 People in a Circle with a Gun', category: 'other', difficulty: 'hard', reward: 55, companies: ['IgniWorld'], question: '100 people in a circle. Person 1 has a gun, kills person 2, passes gun to 3, who kills 4, etc. Who survives?', hint: 'Josephus problem. When n=2^k, survivor is 1. General n: J(n)=2*(n-2^floor(log2 n))+1.', answer: 'Josephus: for n=100, survivor is position 73 (or as per formula 2*(100-64)+1=73).', verification_question: 'Which mathematical problem models this elimination pattern?', verification_options: ['Josephus problem', 'Tower of Hanoi', 'Fibonacci sequence', 'Binary search'], verification_answer: 0 },
  { id: 'total-guests-at-party', title: 'Find Total Guests at the Party', category: 'logical', difficulty: 'medium', reward: 45, companies: ['Google'], question: 'At a party everyone shakes hands with everyone else. Total handshakes are 66. How many people?', hint: 'n people: handshakes = n(n-1)/2 = 66. So n(n-1)=132, n=12.', answer: 'n(n-1)/2 = 66, so n^2 - n - 132 = 0, (n-12)(n+11)=0, n=12 people.', verification_question: 'Why is the formula n(n-1)/2 used for handshakes?', verification_options: ['Each pair of people shakes hands exactly once', 'Everyone shakes hands twice', 'Guests form groups', 'Handshakes are random'], verification_answer: 0 },
  { id: 'poisoned-wine-binary', title: 'Poisoned Wine and Binary Strategy', category: 'mathematical', difficulty: 'hard', reward: 58, companies: ['Google', 'Microsoft'], question: 'You have 1000 bottles of wine; one is poisoned. The poison shows its effect in 24 hours. You have 10 prisoners. How do you find the poisoned bottle in 24 hours?', hint: 'Label bottles 0–999 in binary (10 bits). Prisoner i drinks from every bottle with bit i = 1.', answer: 'Number bottles 0–999. Each prisoner i drinks from bottles whose binary has 1 in position i. After 24 hours, the set of dead prisoners gives the 10-bit binary number of the poisoned bottle.', verification_question: 'Why does using prisoners as binary digits identify the poisoned bottle in one round?', verification_options: ['Each prisoner represents a binary bit; dead/alive gives the bottle number', 'Prisoners drink equal amounts', 'Binary reduces poison', 'More prisoners are needed'], verification_answer: 0 }
];

/**
 * Unique companies that appear in puzzles (sorted), with "All" first.
 */
const _companiesSet = new Set();
INTERVIEW_PUZZLES.forEach(p => {
  if (p.companies) p.companies.forEach(c => _companiesSet.add(c));
});
export const PUZZLE_COMPANIES = ['All', ...[..._companiesSet].sort()];

/**
 * Get puzzle by id.
 */
export function getPuzzleById(id) {
  return INTERVIEW_PUZZLES.find(p => p.id === id) || null;
}

/**
 * Get all puzzle ids (for backend reward validation).
 */
export function getAllPuzzleIds() {
  return INTERVIEW_PUZZLES.map(p => p.id);
}

/**
 * Get puzzles by category and optionally by company.
 */
export function getPuzzlesByCategory(category) {
  if (!category || category === 'all') return INTERVIEW_PUZZLES;
  return INTERVIEW_PUZZLES.filter(p => p.category === category);
}

/**
 * Get puzzles by category and company filter.
 */
export function getPuzzlesByCategoryAndCompany(category, company) {
  let list = getPuzzlesByCategory(category);
  if (company && company !== 'All') {
    list = list.filter(p => p.companies && p.companies.includes(company));
  }
  return list;
}
