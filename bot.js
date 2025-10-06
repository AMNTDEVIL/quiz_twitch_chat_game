require('dotenv').config();
const tmi = require('tmi.js');
const fs = require('fs');

// Load quiz questions
const questions = JSON.parse(fs.readFileSync('questions.json', 'utf8'));

const client = new tmi.Client({
    options: { debug: true },
    identity: {
        username: process.env.TWITCH_BOT_USERNAME,
        password: process.env.TWITCH_OAUTH_TOKEN
    },
    channels: [process.env.TWITCH_CHANNEL]
});

let players = {}; // { username: score }
let gameActive = false;
let currentQuestion = null;
let currentAnswer = null;
let askedQuestions = [];

// Function: get a random unused question
function getRandomQuestion() {
    if (askedQuestions.length === questions.length) askedQuestions = []; // reset if all used
    let q;
    do {
        q = questions[Math.floor(Math.random() * questions.length)];
    } while (askedQuestions.includes(q.question));
    askedQuestions.push(q.question);
    return q;
}

// Ask new question
function askNewQuestion(channel) {
    const q = getRandomQuestion();
    currentQuestion = q.question;
    currentAnswer = q.answer;
    client.say(channel, `🧠 Quiz Question: ${currentQuestion}`);
}

// Check if game has a winner
function checkWinner(channel) {
    for (const [player, score] of Object.entries(players)) {
        if (score >= 5) {
            client.say(channel, `🏆 ${player} wins the game with ${score} points!`);
            gameActive = false;
            players = {};
            currentQuestion = null;
            currentAnswer = null;
            askedQuestions = [];
            return true;
        }
    }
    return false;
}

// Start game
function startGame(channel) {
    if (Object.keys(players).length === 0) {
        client.say(channel, "No players joined yet! Type !play to join the game.");
        return;
    }
    gameActive = true;
    client.say(channel, "🎮 The quiz begins! First to 5 points wins!");
    askNewQuestion(channel);
}

// Show scoreboard
function showScoreboard(channel) {
    if (Object.keys(players).length === 0) {
        client.say(channel, "📊 No players yet! Use !play to join.");
        return;
    }

    const sorted = Object.entries(players)
        .sort((a, b) => b[1] - a[1]);

    let msg = "🏆 Current Scores:\n";
    sorted.forEach(([user, score], i) => {
        msg += `${i + 1}. ${user} — ${score} points\n`;
    });

    client.say(channel, msg.trim());
}

// Connect bot
client.connect();

client.on('message', (channel, userstate, message, self) => {
    if (self) return;
    const msg = message.trim();
    const username = userstate['display-name'];

    // !play — join the game
    if (msg === '!play') {
        if (gameActive) {
            client.say(channel, `${username}, game is already in progress!`);
            return;
        }

        if (!players[username]) {
            players[username] = 0;
            client.say(channel, `${username} joined the game! 🎉`);
        } else {
            client.say(channel, `${username}, you’re already in!`);
        }
        return;
    }

    // !start — starts game (streamer only)
    if (msg === '!start') {
        const channelName = process.env.TWITCH_CHANNEL.replace('#', '');
        if (username.toLowerCase() !== channelName.toLowerCase()) {
            client.say(channel, "Only the streamer can start the game!");
            return;
        }

        if (gameActive) {
            client.say(channel, "Game is already running!");
            return;
        }

        startGame(channel);
        return;
    }

    // !scoreboard — show current scores
    if (msg === '!scoreboard') {
        showScoreboard(channel);
        return;
    }

    // Answering the question
    if (msg.toLowerCase().startsWith('!answer ')) {
        if (!gameActive) {
            client.say(channel, `${username}, no active game right now. Type !play to join and !start to begin.`);
            return;
        }
        if (!currentQuestion) {
            client.say(channel, `No active question yet. Wait for the next one!`);
            return;
        }

        const userAnswer = msg.slice(8).trim();
        if (!userAnswer) return;

        if (userAnswer.toLowerCase() === currentAnswer.toLowerCase()) {
            client.say(channel, `✅ Correct, ${username}! The answer was "${currentAnswer}".`);
            players[username] += 1;
            currentQuestion = null;
            currentAnswer = null;

            // check winner
            if (checkWinner(channel)) return;

            // next question
            setTimeout(() => {
                askNewQuestion(channel);
            }, 3000);
        } else {
            client.say(channel, `❌ Sorry, ${username}, that's not correct!`);
        }
        return;
    }

    // !end — force end (streamer only)
    if (msg === '!end') {
        const channelName = process.env.TWITCH_CHANNEL.replace('#', '');
        if (username.toLowerCase() !== channelName.toLowerCase()) {
            client.say(channel, "Only the streamer can end the game!");
            return;
        }

        gameActive = false;
        client.say(channel, "🛑 Game ended by streamer. Type !play to join next round!");
        players = {};
        currentQuestion = null;
        currentAnswer = null;
        askedQuestions = [];
    }
});

