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
let singlePlayer = false; // for infinite rounds

// Function: get a random unused question
function getRandomQuestion() {
    if (askedQuestions.length === questions.length) askedQuestions = [];
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

// Check winner for multiplayer
function checkWinner(channel) {
    for (const [player, score] of Object.entries(players)) {
        if (score >= 5) {
            client.say(channel, `🏆 ${player} wins the game with ${score} points!`);
            gameActive = false;
            singlePlayer = false;
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
function startGame(channel, username, isSingle = false) {
    if (Object.keys(players).length === 0 && !isSingle) {
        client.say(channel, "No players joined yet! Type !playquiz to join the game.");
        return;
    }
    gameActive = true;
    singlePlayer = isSingle;

    if (isSingle) {
        client.say(channel, `🎮 Single-player quiz started for ${username}! Infinite rounds until you stop typing.`);
    } else {
        client.say(channel, "🎮 The quiz begins! First to 5 points wins!");
    }

    askNewQuestion(channel);
}

// Show scoreboard
function showScoreboard(channel) {
    if (Object.keys(players).length === 0) {
        client.say(channel, "📊 No players yet! Use !playquiz to join.");
        return;
    }

    const sorted = Object.entries(players).sort((a, b) => b[1] - a[1]);
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

    // !playquiz — join multiplayer
    if (msg === '!playquiz') {
        if (gameActive && !singlePlayer) {
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

    // !single — start single-player infinite round
    if (msg === '!single') {
        if (gameActive) {
            client.say(channel, "Game is already running!");
            return;
        }

        players[username] = 0; // track score optionally
        startGame(channel, username, true);
        return;
    }

    // !start — starts multiplayer game (streamer only)
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

        startGame(channel, username, false);
        return;
    }

    // !scoreboard — show current scores
    if (msg === '!scoreboard') {
        showScoreboard(channel);
        return;
    }

    // !quiz — repeat current question
    if (msg === '!quiz') {
        if (!gameActive || !currentQuestion) {
            client.say(channel, "No active question! Start a game first with !playquiz or !single.");
            return;
        }
        client.say(channel, `🧠 Current Question: ${currentQuestion}`);
        return;
    }

    // !pass — skip question and show answer
    if (msg === '!pass') {
        if (!gameActive || !currentQuestion) {
            client.say(channel, "No active question to skip!");
            return;
        }
        client.say(channel, `⏭ ${username} passed! The answer was: "${currentAnswer}"`);
        currentQuestion = null;
        currentAnswer = null;

        setTimeout(() => askNewQuestion(channel), 2000);
        return;
    }

    // Answer question
    if (msg.toLowerCase().startsWith('!answer ')) {
        if (!gameActive) {
            client.say(channel, `${username}, no active game right now. Type !playquiz or !single to start.`);
            return;
        }
        if (!currentQuestion) {
            client.say(channel, "No active question yet. Wait for the next one!");
            return;
        }

        const userAnswer = msg.slice(8).trim();
        if (!userAnswer) return;

        if (userAnswer.toLowerCase() === currentAnswer.toLowerCase()) {
            client.say(channel, `✅ Correct, ${username}! The answer was "${currentAnswer}".`);

            if (!singlePlayer) {
                players[username] += 1;
                if (checkWinner(channel)) return;
            }

            currentQuestion = null;
            currentAnswer = null;

            setTimeout(() => askNewQuestion(channel), 2000);
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
        singlePlayer = false;
        client.say(channel, "🛑 Game ended by streamer. Type !playquiz or !single to join next round!");
        players = {};
        currentQuestion = null;
        currentAnswer = null;
        askedQuestions = [];
    }
});

