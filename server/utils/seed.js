import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import pool from '../config/db.js';
import { generateAllTimetables, BRANCHES, SECTIONS } from './timetableGenerator.js';

dotenv.config();

// ---------- Helper generators for large practice question banks ----------

function buildAptitudeQuestions() {
  const qs = [];

  // Speed/Distance/Time - generated variations
  const sdtData = [
    [60, 1.5], [80, 2], [45, 3], [100, 2.5], [72, 4], [90, 1], [54, 3.5], [120, 2],
    [36, 1.5], [64, 0.5], [48, 4], [96, 3], [150, 5], [40, 2], [75, 1.5], [200, 4],
    [30, 0.75], [88, 2.2], [66, 1.1], [110, 2.75]
  ];
  sdtData.forEach(([dist, time], i) => {
    const speed = (dist / time);
    qs.push({
      difficulty: i % 3 === 0 ? 'hard' : i % 2 === 0 ? 'medium' : 'easy',
      question: `A train travels ${dist} km in ${time} hours. What is its average speed?`,
      answer: `${speed % 1 === 0 ? speed : speed.toFixed(2)} km/h (Speed = Distance / Time = ${dist} / ${time})`
    });
  });

  // Percentage questions
  const pctData = [
    [20, 150], [15, 200], [25, 480], [40, 90], [12, 500], [35, 220], [50, 640],
    [18, 350], [60, 75], [8, 900], [45, 160], [22, 410], [33, 300], [75, 240],
    [10, 990], [28, 175], [55, 320], [17, 600], [63, 200], [9, 1200]
  ];
  pctData.forEach(([pct, base], i) => {
    const result = (pct / 100) * base;
    qs.push({
      difficulty: i % 4 === 0 ? 'hard' : i % 2 === 0 ? 'medium' : 'easy',
      question: `What is ${pct}% of ${base}?`,
      answer: `${result % 1 === 0 ? result : result.toFixed(2)} (${pct}/100 × ${base})`
    });
  });

  // Profit and Loss
  const plData = [
    [500, 600], [1200, 1000], [750, 900], [2000, 1800], [340, 400], [1500, 1650],
    [800, 720], [950, 1100], [600, 540], [1800, 2100], [400, 460], [1000, 950],
    [2500, 2750], [300, 270], [1100, 1210], [650, 700], [1900, 1700], [450, 500]
  ];
  plData.forEach(([cost, sell], i) => {
    const diff = sell - cost;
    const isProfit = diff >= 0;
    const pct = Math.abs((diff / cost) * 100);
    qs.push({
      difficulty: i % 3 === 0 ? 'medium' : 'easy',
      question: `A shopkeeper buys an item for ₹${cost} and sells it for ₹${sell}. What is the ${isProfit ? 'profit' : 'loss'} percentage?`,
      answer: `${pct.toFixed(2)}% ${isProfit ? 'profit' : 'loss'} (Difference ₹${Math.abs(diff)} / Cost ₹${cost} × 100)`
    });
  });

  // Work and Time
  const workData = [
    [12, 15], [10, 20], [8, 12], [6, 9], [15, 25], [18, 24], [5, 10], [14, 21],
    [9, 18], [7, 14], [20, 30], [11, 22], [16, 32], [13, 26], [4, 8]
  ];
  workData.forEach(([a, b], i) => {
    const combined = (1 / ((1 / a) + (1 / b))).toFixed(2);
    qs.push({
      difficulty: i % 2 === 0 ? 'hard' : 'medium',
      question: `A can complete a work in ${a} days and B can complete it in ${b} days. How long will they take working together?`,
      answer: `${combined} days (1/(1/${a} + 1/${b}))`
    });
  });

  // Simple averages / number series
  const avgSets = [
    [12, 15, 18, 21, 24], [10, 20, 30, 40, 50], [5, 10, 15, 20], [7, 14, 21, 28, 35],
    [100, 200, 300], [23, 46, 69, 92], [3, 6, 9, 12, 15], [8, 16, 24, 32],
    [11, 22, 33, 44], [9, 18, 27, 36, 45], [14, 28, 42], [6, 12, 18, 24, 30],
    [2, 4, 6, 8, 10], [17, 34, 51], [25, 50, 75, 100]
  ];
  avgSets.forEach((set, i) => {
    const avg = set.reduce((a, b) => a + b, 0) / set.length;
    qs.push({
      difficulty: i % 3 === 0 ? 'easy' : 'medium',
      question: `Find the average of: ${set.join(', ')}`,
      answer: `${avg % 1 === 0 ? avg : avg.toFixed(2)}`
    });
  });

  // Simple/Compound interest
  const interestData = [
    [1000, 5, 2], [2000, 4, 3], [1500, 6, 2], [5000, 8, 1], [3000, 10, 2],
    [4000, 7, 3], [2500, 5, 4], [6000, 6, 2], [1200, 9, 3], [800, 12, 2]
  ];
  interestData.forEach(([principal, rate, time], i) => {
    const si = (principal * rate * time) / 100;
    qs.push({
      difficulty: i % 2 === 0 ? 'medium' : 'hard',
      question: `Find the simple interest on ₹${principal} at ${rate}% per annum for ${time} years.`,
      answer: `₹${si} (SI = P×R×T/100 = ${principal}×${rate}×${time}/100)`
    });
  });

  return qs;
}

function buildVerbalQuestions() {
  const qs = [];

  const synonymPairs = [
    ['Abundant', 'Plentiful'], ['Benevolent', 'Kind'], ['Candid', 'Honest'], ['Diligent', 'Hardworking'],
    ['Eloquent', 'Articulate'], ['Frugal', 'Thrifty'], ['Gregarious', 'Sociable'], ['Hostile', 'Unfriendly'],
    ['Immense', 'Huge'], ['Jubilant', 'Joyful'], ['Keen', 'Eager'], ['Lucid', 'Clear'],
    ['Meticulous', 'Careful'], ['Novice', 'Beginner'], ['Obsolete', 'Outdated'], ['Prudent', 'Wise'],
    ['Quaint', 'Charming'], ['Resilient', 'Tough'], ['Skeptical', 'Doubtful'], ['Tranquil', 'Calm'],
    ['Vivid', 'Bright'], ['Zealous', 'Passionate'], ['Ample', 'Sufficient'], ['Brisk', 'Quick'],
    ['Cordial', 'Friendly'], ['Dubious', 'Uncertain'], ['Elated', 'Delighted'], ['Feeble', 'Weak'],
    ['Genuine', 'Authentic'], ['Humble', 'Modest'], ['Intricate', 'Complex'], ['Jovial', 'Cheerful'],
    ['Lethargic', 'Sluggish'], ['Meager', 'Scanty'], ['Notorious', 'Infamous'], ['Optimistic', 'Hopeful'],
    ['Pristine', 'Pure'], ['Rigid', 'Stiff'], ['Sturdy', 'Strong'], ['Tedious', 'Boring']
  ];
  synonymPairs.forEach(([word, ans], i) => {
    qs.push({
      difficulty: i % 3 === 0 ? 'hard' : i % 2 === 0 ? 'medium' : 'easy',
      question: `What is a synonym for "${word}"?`,
      answer: ans
    });
  });

  const antonymPairs = [
    ['Abundant', 'Scarce'], ['Benevolent', 'Cruel'], ['Candid', 'Deceptive'], ['Diligent', 'Lazy'],
    ['Eloquent', 'Inarticulate'], ['Frugal', 'Wasteful'], ['Gregarious', 'Reserved'], ['Hostile', 'Friendly'],
    ['Immense', 'Tiny'], ['Jubilant', 'Sorrowful'], ['Keen', 'Indifferent'], ['Lucid', 'Confusing'],
    ['Meticulous', 'Careless'], ['Novice', 'Expert'], ['Obsolete', 'Modern'], ['Prudent', 'Reckless'],
    ['Resilient', 'Fragile'], ['Skeptical', 'Trusting'], ['Tranquil', 'Chaotic'], ['Vivid', 'Dull'],
    ['Zealous', 'Apathetic'], ['Ample', 'Insufficient'], ['Brisk', 'Slow'], ['Cordial', 'Cold'],
    ['Dubious', 'Certain'], ['Elated', 'Depressed'], ['Feeble', 'Robust'], ['Genuine', 'Fake'],
    ['Humble', 'Arrogant'], ['Jovial', 'Gloomy'], ['Lethargic', 'Energetic'], ['Meager', 'Ample'],
    ['Optimistic', 'Pessimistic'], ['Pristine', 'Dirty'], ['Rigid', 'Flexible'], ['Sturdy', 'Flimsy'],
    ['Tedious', 'Exciting'], ['Ancient', 'Modern'], ['Bold', 'Timid'], ['Cautious', 'Careless']
  ];
  antonymPairs.forEach(([word, ans], i) => {
    qs.push({
      difficulty: i % 3 === 0 ? 'medium' : i % 2 === 0 ? 'hard' : 'easy',
      question: `What is an antonym (opposite) for "${word}"?`,
      answer: ans
    });
  });

  const analogies = [
    ['Doctor', 'Hospital', 'Teacher', 'School'], ['Pen', 'Write', 'Knife', 'Cut'],
    ['Bird', 'Sky', 'Fish', 'Water'], ['Author', 'Book', 'Composer', 'Music'],
    ['Puppy', 'Dog', 'Kitten', 'Cat'], ['Chef', 'Kitchen', 'Pilot', 'Cockpit'],
    ['Thermometer', 'Temperature', 'Speedometer', 'Speed'], ['Foot', 'Leg', 'Hand', 'Arm'],
    ['Painter', 'Brush', 'Writer', 'Pen'], ['Ocean', 'Water', 'Desert', 'Sand'],
    ['King', 'Palace', 'Prisoner', 'Jail'], ['Bee', 'Hive', 'Bird', 'Nest'],
    ['Novel', 'Chapter', 'Building', 'Floor'], ['Tailor', 'Clothes', 'Carpenter', 'Furniture'],
    ['Engine', 'Car', 'Heart', 'Body']
  ];
  analogies.forEach(([a, b, c, d], i) => {
    qs.push({
      difficulty: i % 3 === 0 ? 'hard' : 'medium',
      question: `Complete the analogy: ${a} : ${b} :: ${c} : ____`,
      answer: d
    });
  });

  const oddOneOutSets = [
    [['Apple', 'Mango', 'Carrot', 'Banana'], 'Carrot (the others are fruits, this is a vegetable)'],
    [['Delhi', 'Mumbai', 'Chennai', 'India'], 'India (the others are cities, this is a country)'],
    [['Square', 'Circle', 'Triangle', 'River'], 'River (the others are shapes)'],
    [['Piano', 'Guitar', 'Violin', 'Painting'], 'Painting (the others are musical instruments)'],
    [['Cricket', 'Football', 'Tennis', 'Newspaper'], 'Newspaper (the others are sports)'],
    [['Rose', 'Lily', 'Tulip', 'Oak'], 'Oak (the others are flowers, this is a tree)'],
    [['Gold', 'Silver', 'Iron', 'Diamond'], 'Diamond (the others are metals)'],
    [['Monday', 'Tuesday', 'January', 'Friday'], 'January (the others are days, this is a month)'],
    [['Whale', 'Shark', 'Dolphin', 'Crocodile'], 'Crocodile (the others primarily live underwater as aquatic mammals/fish)'],
    [['Pen', 'Pencil', 'Eraser', 'Notebook'], 'Notebook (the others are writing/correction tools)']
  ];
  oddOneOutSets.forEach(([set, ans], i) => {
    qs.push({
      difficulty: i % 2 === 0 ? 'easy' : 'medium',
      question: `Find the odd one out: ${set.join(', ')}`,
      answer: ans
    });
  });

  return qs;
}

function buildCodingQuestions() {
  return [
    { difficulty: 'easy', question: 'Write a function to check if a number is prime.', answer: 'function isPrime(n) { if (n <= 1) return false; for (let i = 2; i * i <= n; i++) { if (n % i === 0) return false; } return true; }' },
    { difficulty: 'easy', question: 'Write a function to calculate the factorial of a number.', answer: 'function factorial(n) { return n <= 1 ? 1 : n * factorial(n - 1); }' },
    { difficulty: 'easy', question: 'Write a function to reverse a string.', answer: 'function reverseStr(s) { return s.split("").reverse().join(""); }' },
    { difficulty: 'easy', question: 'Write a function to check if a string is a palindrome.', answer: 'function isPalindrome(s) { const rev = s.split("").reverse().join(""); return s === rev; }' },
    { difficulty: 'easy', question: 'Write a function to find the largest number in an array.', answer: 'function findMax(arr) { return Math.max(...arr); }' },
    { difficulty: 'easy', question: 'Write a function to count vowels in a string.', answer: 'function countVowels(s) { return (s.match(/[aeiouAEIOU]/g) || []).length; }' },
    { difficulty: 'easy', question: 'Write a function to sum all numbers in an array.', answer: 'function sumArray(arr) { return arr.reduce((a, b) => a + b, 0); }' },
    { difficulty: 'easy', question: 'Write a function to check if a number is even or odd.', answer: 'function isEven(n) { return n % 2 === 0; }' },
    { difficulty: 'easy', question: 'Write a function to find the FizzBuzz sequence from 1 to n.', answer: 'function fizzBuzz(n) { for (let i = 1; i <= n; i++) { console.log(i % 15 === 0 ? "FizzBuzz" : i % 3 === 0 ? "Fizz" : i % 5 === 0 ? "Buzz" : i); } }' },
    { difficulty: 'easy', question: 'Write a function to remove duplicates from an array.', answer: 'function removeDuplicates(arr) { return [...new Set(arr)]; }' },
    { difficulty: 'easy', question: 'Write a function to convert a string to uppercase without built-in methods.', answer: 'function toUpper(s) { return s.split("").map(c => c.toLowerCase() === c && c.toUpperCase() !== c ? String.fromCharCode(c.charCodeAt(0) - 32) : c).join(""); }' },
    { difficulty: 'easy', question: 'Write a function to find the sum of digits of a number.', answer: 'function sumDigits(n) { return String(n).split("").reduce((a, d) => a + Number(d), 0); }' },
    { difficulty: 'easy', question: 'Write a function to check if a year is a leap year.', answer: 'function isLeapYear(y) { return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0; }' },
    { difficulty: 'easy', question: 'Write a function to swap two numbers without a temporary variable.', answer: 'let [a, b] = [5, 10]; [a, b] = [b, a];' },
    { difficulty: 'easy', question: 'Write a function to find the second largest number in an array.', answer: 'function secondLargest(arr) { const sorted = [...new Set(arr)].sort((a,b) => b - a); return sorted[1]; }' },
    { difficulty: 'medium', question: 'Write a function to reverse a linked list.', answer: 'function reverseList(head) { let prev = null, curr = head; while (curr) { const next = curr.next; curr.next = prev; prev = curr; curr = next; } return prev; }' },
    { difficulty: 'medium', question: 'Write a function to check if two strings are anagrams.', answer: 'function isAnagram(a, b) { const norm = s => s.toLowerCase().split("").sort().join(""); return norm(a) === norm(b); }' },
    { difficulty: 'medium', question: 'Write a function to find the missing number in an array of 1 to n.', answer: 'function missingNumber(arr, n) { const total = n * (n + 1) / 2; const sum = arr.reduce((a, b) => a + b, 0); return total - sum; }' },
    { difficulty: 'medium', question: 'Implement binary search on a sorted array.', answer: 'function binarySearch(arr, target) { let lo = 0, hi = arr.length - 1; while (lo <= hi) { const mid = Math.floor((lo + hi) / 2); if (arr[mid] === target) return mid; if (arr[mid] < target) lo = mid + 1; else hi = mid - 1; } return -1; }' },
    { difficulty: 'medium', question: 'Write a function to find the intersection of two arrays.', answer: 'function intersection(a, b) { const setB = new Set(b); return a.filter(x => setB.has(x)); }' },
    { difficulty: 'medium', question: 'Implement bubble sort on an array.', answer: 'function bubbleSort(arr) { for (let i = 0; i < arr.length; i++) { for (let j = 0; j < arr.length - i - 1; j++) { if (arr[j] > arr[j+1]) [arr[j], arr[j+1]] = [arr[j+1], arr[j]]; } } return arr; }' },
    { difficulty: 'medium', question: 'Write a function to flatten a nested array.', answer: 'function flatten(arr) { return arr.reduce((flat, item) => flat.concat(Array.isArray(item) ? flatten(item) : item), []); }' },
    { difficulty: 'medium', question: 'Write a function to find the first non-repeating character in a string.', answer: 'function firstNonRepeat(s) { for (const c of s) { if (s.indexOf(c) === s.lastIndexOf(c)) return c; } return null; }' },
    { difficulty: 'medium', question: 'Write a function to implement a stack using an array (push, pop, peek).', answer: 'class Stack { constructor() { this.items = []; } push(x) { this.items.push(x); } pop() { return this.items.pop(); } peek() { return this.items[this.items.length - 1]; } }' },
    { difficulty: 'medium', question: 'Write a function to find the GCD of two numbers.', answer: 'function gcd(a, b) { return b === 0 ? a : gcd(b, a % b); }' },
    { difficulty: 'medium', question: 'Write a function to find the LCM of two numbers.', answer: 'function lcm(a, b) { return (a * b) / gcd(a, b); }' },
    { difficulty: 'medium', question: 'Write a function to rotate an array by k positions.', answer: 'function rotate(arr, k) { k = k % arr.length; return [...arr.slice(-k), ...arr.slice(0, arr.length - k)]; }' },
    { difficulty: 'medium', question: 'Write a function that returns all pairs in an array that sum to a target value.', answer: 'function twoSum(arr, target) { const seen = new Set(); const pairs = []; for (const n of arr) { if (seen.has(target - n)) pairs.push([n, target - n]); seen.add(n); } return pairs; }' },
    { difficulty: 'medium', question: 'Write a function to capitalize the first letter of every word in a sentence.', answer: 'function capitalizeWords(s) { return s.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" "); }' },
    { difficulty: 'medium', question: 'Write a function to implement a queue using two stacks.', answer: 'class Queue { constructor() { this.in = []; this.out = []; } enqueue(x) { this.in.push(x); } dequeue() { if (!this.out.length) { while (this.in.length) this.out.push(this.in.pop()); } return this.out.pop(); } }' },
    { difficulty: 'hard', question: 'Find the longest palindromic substring in a string.', answer: 'Use the expand-around-center technique: for each index, expand outward in both directions while characters match, tracking the longest palindrome found across all centers.' },
    { difficulty: 'hard', question: 'Find the maximum sum of a contiguous subarray (Kadane\'s Algorithm).', answer: 'function maxSubArray(arr) { let maxSoFar = arr[0], maxEndingHere = arr[0]; for (let i = 1; i < arr.length; i++) { maxEndingHere = Math.max(arr[i], maxEndingHere + arr[i]); maxSoFar = Math.max(maxSoFar, maxEndingHere); } return maxSoFar; }' },
    { difficulty: 'hard', question: 'Detect a cycle in a linked list.', answer: 'Use Floyd\'s Cycle Detection (slow/fast pointers): move slow by 1 and fast by 2 steps; if they ever meet, there is a cycle. If fast reaches null, there is no cycle.' },
    { difficulty: 'hard', question: 'Implement merge sort on an array.', answer: 'function mergeSort(arr) { if (arr.length <= 1) return arr; const mid = Math.floor(arr.length / 2); const left = mergeSort(arr.slice(0, mid)); const right = mergeSort(arr.slice(mid)); const result = []; let i = 0, j = 0; while (i < left.length && j < right.length) result.push(left[i] <= right[j] ? left[i++] : right[j++]); return [...result, ...left.slice(i), ...right.slice(j)]; }' },
    { difficulty: 'hard', question: 'Find the number of ways to climb n stairs taking 1 or 2 steps at a time.', answer: 'This is the Fibonacci sequence: ways(n) = ways(n-1) + ways(n-2), with ways(0)=1 and ways(1)=1. Use dynamic programming for O(n) time.' },
    { difficulty: 'hard', question: 'Given a matrix, rotate it 90 degrees clockwise in place.', answer: 'First transpose the matrix (swap rows and columns), then reverse each row. This achieves an in-place 90° clockwise rotation in O(n²) time, O(1) extra space.' },
    { difficulty: 'hard', question: 'Find the lowest common ancestor (LCA) of two nodes in a binary search tree.', answer: 'Starting at the root, if both target values are less than the current node, move left; if both are greater, move right; otherwise, the current node is the LCA.' },
    { difficulty: 'hard', question: 'Implement a Least Recently Used (LRU) Cache.', answer: 'Use a combination of a HashMap and a doubly linked list. The HashMap gives O(1) lookup, and the linked list tracks usage order so the least recently used item can be evicted in O(1).' },
    { difficulty: 'hard', question: 'Find all permutations of a string.', answer: 'function permute(s, prefix = "") { if (s.length === 0) { console.log(prefix); return; } for (let i = 0; i < s.length; i++) { permute(s.slice(0, i) + s.slice(i + 1), prefix + s[i]); } }' },
    { difficulty: 'hard', question: 'Check if a binary tree is balanced (height-balanced).', answer: 'Recursively compute the height of each subtree. A tree is balanced if, for every node, the height difference between left and right subtrees is at most 1, and both subtrees are themselves balanced.' },
    { difficulty: 'hard', question: 'Explain and implement the Sieve of Eratosthenes to find all primes up to n.', answer: 'function sieve(n) { const isPrime = new Array(n + 1).fill(true); isPrime[0] = isPrime[1] = false; for (let i = 2; i * i <= n; i++) { if (isPrime[i]) { for (let j = i * i; j <= n; j += i) isPrime[j] = false; } } return isPrime.map((v, i) => v ? i : null).filter(Boolean); }' }
  ];
}

async function seed() {
  console.log('Seeding database...');

  try {
    // Events - admin can add/edit/delete more from the dashboard.
    // Last element of each row is its interest_tags array, used to power the
    // "Picked for you" section on the student dashboard.
    // Last two elements of each row are [requires_team, team_size] — used to
    // demo/test the in-portal "team/group registration" form (team name +
    // each member's name/section/year) without needing an external Google Form.
    const events = [
      ['Orientation Week', 'Dr. Rajeev Kumar', '2026-07-25', '10:00:00', 'Main Auditorium', 'Welcome freshers', 'cultural', 'Introduction to campus', 'None', 'Student Affairs', [], false, 1],
      ['Coding Competition', 'Prof. Sharma', '2026-08-10', '09:00:00', 'Lab Building', 'Coding challenge', 'technical', 'Competitive programming', 'None', 'Coding Club', ['coding'], true, 3],
      ['Tech Talk - AI Future', 'Amit Desai', '2026-08-15', '15:00:00', 'Seminar Hall', 'AI trends', 'technical', 'Industry expert talk', 'Microsoft', 'AI Club', ['coding', 'AI/ML'], false, 1],
      ['Sports Day', 'Rajesh Nair', '2026-09-01', '09:00:00', 'Sports Ground', 'Inter-class sports', 'all', 'Various sports events', 'None', 'Sports', ['sports'], false, 1],
      ['Placement Talk - TCS', 'Rahul Sharma', '2026-09-10', '10:00:00', 'Auditorium', 'TCS hiring', 'technical', 'Hiring process', 'TCS', 'Placement', [], false, 1],
      ['Cultural Night', 'Sophia Khan', '2026-08-28', '18:30:00', 'Open Air Theatre', 'Talent showcase', 'cultural', 'Music, dance & drama performances', 'None', 'Cultural Club', ['music', 'dance', 'drama'], false, 1],
      ['Campus Photography Walk', 'Kiran Rao', '2026-08-05', '07:30:00', 'Campus Grounds', 'Capture campus life', 'cultural', 'Guided photo walk', 'None', 'Photography Club', ['photography'], false, 1],
      ['Inter-Class Debate', 'Dr. Kavya Iyer', '2026-09-05', '13:00:00', 'Conference Room', 'Debate competition', 'cultural', 'Topics announced on the day', 'None', 'Debate Society', ['debate', 'public speaking'], true, 2],
      ['Freshers Gaming Night', 'Arjun Menon', '2026-08-12', '17:00:00', 'Recreation Hall', 'Esports & board games', 'cultural', 'BGMI, FIFA, chess & more', 'None', 'Gaming Club', ['gaming'], false, 1],
      ['Startup Pitch Day', 'Lisa Desai', '2026-09-18', '11:00:00', 'Seminar Hall', 'Student startup pitches', 'technical', 'Pitch your idea to a panel', 'None', 'E-Cell', ['entrepreneurship', 'design'], true, 4]
    ];

    await pool.query('DELETE FROM events');
    for (const e of events) {
      const [title, incharge_name, event_date, event_time, place, purpose, category, agenda, company, organizer, interest_tags, requires_team, team_size] = e;
      await pool.query(
        'INSERT INTO events (title, incharge_name, event_date, event_time, place, purpose, category, agenda, company, organizer, interest_tags, requires_team, team_size) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [title, incharge_name, event_date, event_time, place, purpose, category, agenda, company, organizer, JSON.stringify(interest_tags), requires_team, team_size]
      );
    }
    console.log(`✓ Inserted ${events.length} events`);

    // Clubs - admin can add/edit/delete more from the dashboard.
    // Last two elements of each row are [requires_team, team_size] — same
    // team-registration demo data as the events above.
    const clubs = [
      ['Coding Club', 'Rahul Kumar', 'Wednesday 4:00 PM', 'Lab A-101', 'Programming', 'technical', 'Learn coding & algorithms', ['coding'], false, 1],
      ['AI & ML Club', 'Priya Sharma', 'Thursday 3:30 PM', 'Lab B-201', 'AI Projects', 'technical', 'Explore AI and ML', ['coding', 'AI/ML'], false, 1],
      ['Cultural Club', 'Neha Singh', 'Friday 6:00 PM', 'Auditorium', 'Arts & Music', 'cultural', 'Celebrate diverse cultures', ['music', 'dance', 'drama'], false, 1],
      ['Sports Club', 'Vikram Sinha', 'Daily 6:00 AM', 'Sports Ground', 'Sports', 'all', 'Stay fit and active', ['sports'], false, 1],
      ['Robotics Club', 'Aditya Singh', 'Wednesday 5:00 PM', 'Robotics Lab', 'Robotics', 'technical', 'Build and program robots', ['robotics'], true, 3],
      ['Photography Club', 'Kiran Rao', 'Saturday 10:00 AM', 'Media Room', 'Visual Arts', 'cultural', 'Learn composition, editing & storytelling', ['photography'], false, 1],
      ['Debate Society', 'Dr. Kavya Iyer', 'Tuesday 5:00 PM', 'Conference Room', 'Public Speaking', 'cultural', 'Sharpen your argument & delivery', ['debate', 'public speaking'], false, 1],
      ['Entrepreneurship Cell', 'Lisa Desai', 'Monday 6:00 PM', 'Innovation Hub', 'Startups', 'technical', 'Build & pitch your own ideas', ['entrepreneurship', 'design'], false, 1],
      ['Readers\' Circle', 'Anitha Menon', 'Friday 4:30 PM', 'Library Hall', 'Literature', 'cultural', 'Book discussions & storytelling', ['reading', 'content creation'], false, 1],
      ['Gaming Club', 'Arjun Menon', 'Saturday 3:00 PM', 'Recreation Hall', 'Esports', 'cultural', 'Casual & competitive gaming sessions', ['gaming'], true, 2]
    ];

    await pool.query('DELETE FROM clubs');
    for (const c of clubs) {
      const [name, incharge_name, time_slot, location, theme, category, description, interest_tags, requires_team, team_size] = c;
      await pool.query(
        'INSERT INTO clubs (name, incharge_name, time_slot, location, theme, category, description, interest_tags, requires_team, team_size) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [name, incharge_name, time_slot, location, theme, category, description, JSON.stringify(interest_tags), requires_team, team_size]
      );
    }
    console.log(`✓ Inserted ${clubs.length} clubs`);

    // Placement questions - 200+ total, no multiple choice.
    // Format: question shown first, answer revealed only after the student clicks "Show Answer".
    const aptitude = buildAptitudeQuestions();
    const verbal = buildVerbalQuestions();
    const coding = buildCodingQuestions();

    await pool.query('DELETE FROM placement_questions');

    let total = 0;
    for (const q of aptitude) {
      await pool.query(
        'INSERT INTO placement_questions (category, difficulty, question, options, answer) VALUES (?, ?, ?, NULL, ?)',
        ['aptitude', q.difficulty, q.question, q.answer]
      );
      total++;
    }
    for (const q of verbal) {
      await pool.query(
        'INSERT INTO placement_questions (category, difficulty, question, options, answer) VALUES (?, ?, ?, NULL, ?)',
        ['verbal', q.difficulty, q.question, q.answer]
      );
      total++;
    }
    for (const q of coding) {
      await pool.query(
        'INSERT INTO placement_questions (category, difficulty, question, options, answer) VALUES (?, ?, ?, NULL, ?)',
        ['coding', q.difficulty, q.question, q.answer]
      );
      total++;
    }

    console.log(`✓ Inserted ${total} placement questions (aptitude: ${aptitude.length}, verbal: ${verbal.length}, coding: ${coding.length})`);

    // Timetables - 1st-year common curriculum, generated for every department/section
    const timetableRows = generateAllTimetables();
    await pool.query('DELETE FROM timetable');
    for (const r of timetableRows) {
      await pool.query(
        `INSERT INTO timetable (branch, year, section, day, period_no, subject_code, subject_name, faculty_name, is_lab)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [r.branch, r.year, r.section, r.day, r.period_no, r.subject_code, r.subject_name, r.faculty_name, r.is_lab]
      );
    }
    console.log(`✓ Inserted ${timetableRows.length} timetable slots (${BRANCHES.length} departments x ${SECTIONS.length} sections, Year 1)`);

    // Default admin account — no separate "npm run create-admin" step needed.
    // Change this password after your first login (or before deploying anywhere
    // public) from the Admin Dashboard / directly in the `admins` table.
    const DEFAULT_ADMIN_USER = 'admin';
    const DEFAULT_ADMIN_PASS = 'Portal123!';
    const [existingAdmins] = await pool.query('SELECT id FROM admins WHERE username = ?', [DEFAULT_ADMIN_USER]);
    if (!existingAdmins.length) {
      const hashedPwd = await bcrypt.hash(DEFAULT_ADMIN_PASS, 10);
      await pool.query('INSERT INTO admins (username, password_hash) VALUES (?, ?)', [DEFAULT_ADMIN_USER, hashedPwd]);
      console.log(`✓ Default admin created — username: ${DEFAULT_ADMIN_USER} / password: ${DEFAULT_ADMIN_PASS}`);
    } else {
      console.log('✓ Admin account already exists, skipped creating a default one');
    }

    console.log('✅ Seeding complete!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
  }
}

seed();
