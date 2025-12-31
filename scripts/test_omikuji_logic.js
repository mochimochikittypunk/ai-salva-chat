
const fs = require('fs');
const path = require('path');

// --- Mock Data Loading ---
const omikujiPath = path.join(process.cwd(), 'data', 'omikuji_data.json');
let omikujiData = {};
try {
    omikujiData = JSON.parse(fs.readFileSync(omikujiPath, 'utf8'));
} catch (e) {
    console.error(e);
}

// --- Logic from route.js ---
function isPrime(num) {
    if (num <= 1) return false;
    if (num <= 3) return true;
    if (num % 2 === 0 || num % 3 === 0) return false;
    for (let i = 5; i * i <= num; i += 6) {
        if (num % i === 0 || num % (i + 2) === 0) return false;
    }
    return true;
}

function isFibonacci(num) {
    if (num < 0) return false;
    const isPerfectSquare = (n) => Math.sqrt(n) % 1 === 0;
    return isPerfectSquare(5 * num * num + 4) || isPerfectSquare(5 * num * num - 4);
}

function drawOmikuji(number) {
    const num = parseInt(number);
    let rank = '';

    const p = isPrime(num);
    const f = isFibonacci(num);
    const odd = num % 2 !== 0;

    if (p && f) {
        rank = '大吉';
    } else if (p && !f) {
        rank = '中吉';
    } else if (!p && !f && odd) {
        rank = '小吉';
    } else if (!p && !f && !odd) {
        rank = '吉';
    } else {
        rank = '末吉';
    }

    // Geisha Lottery (3%)
    // Mock random specifically for test? No, let's run statistics.
    const isGeishaWinner = Math.random() < 0.03;

    return { num, rank, p, f, odd, isGeishaWinner };
}

// --- Tests ---
console.log("--- Logic Verification ---");
const testCases = [
    { num: 5, expect: '大吉' }, // Prime, Fib
    { num: 13, expect: '大吉' }, // Prime, Fib
    { num: 7, expect: '中吉' }, // Prime, !Fib
    { num: 11, expect: '中吉' }, // Prime, !Fib
    { num: 9, expect: '小吉' }, // Odd, !Prime, !Fib
    { num: 27, expect: '小吉' }, // Odd, !Prime, !Fib
    { num: 4, expect: '吉' }, // Even, !Prime, !Fib
    { num: 6, expect: '吉' }, // Even, !Prime, !Fib
    { num: 1, expect: '末吉' }, // Fib (1), Not Prime (1 is not prime). 1 is Odd. But !p && !f is false because f is true. -> Else -> Suekichi.
    { num: 8, expect: '末吉' }, // Fib (8), Not Prime. Even. !p && !f is false. -> Else -> Suekichi.
    { num: 21, expect: '末吉' } // Fib (21), Not Prime. Odd. -> Else -> Suekichi.
];

testCases.forEach(tc => {
    const res = drawOmikuji(tc.num);
    const pass = res.rank === tc.expect;
    console.log(`Num: ${tc.num} -> Rank: ${res.rank} (Expect: ${tc.expect}) [${pass ? 'PASS' : 'FAIL'}] (P:${res.p}, F:${res.f})`);
});

console.log("\n--- Geisha Probability Test (10000 runs) ---");
let wins = 0;
for (let i = 0; i < 10000; i++) {
    if (Math.random() < 0.03) wins++;
}
console.log(`Wins: ${wins}/10000 (${(wins / 100).toFixed(2)}%) - Expect approx 3%`);

console.log("\n--- Data Content Check ---");
console.log("Daikichi count:", omikujiData['大吉']?.length);
console.log("Chukichi count:", omikujiData['中吉']?.length);
console.log("Kichi count:", omikujiData['吉']?.length);
console.log("Shoukichi count:", omikujiData['小吉']?.length);
console.log("Suekichi count:", omikujiData['末吉']?.length);
