# Twitch Quiz Bot

![Node.js](https://img.shields.io/badge/Node.js-16.x-green)
![License](https://img.shields.io/badge/License-MIT-blue)
![GitHub stars](https://img.shields.io/github/stars/AMNTDEVIL/quiz_twitch_chat_game)
![GitHub forks](https://img.shields.io/github/forks/AMNTDEVIL/quiz_twitch_chat_game)

🎮 A Twitch chat bot built with **Node.js** and **tmi.js** that runs interactive quiz games entirely through chat.  
Viewers can join games, answer questions, and compete to be the first to reach 5 points.

---

## Features

- Start a quiz game with `!start` (streamer only)  
- Join a game with `!play`  
- Answer questions via `!answer <your answer>`  
- First player to 5 points wins  
- Scoreboard displayed with `!scoreboard`  
- Prevents late players from joining an ongoing game  
- Supports local JSON question files  
- Fully runs in Twitch chat—no UI required  

[Stream Chat]
amntdevil: !play
amntdevil joined the next game! 🎉

amntdevil: !start
🎮 Quiz started! Players: $amntdevil
First to 5 points wins! Type !answer <your answer>
🧠 Quiz Question: What is 9 × 8?

Example: amntdevil: !answer 72
✅ Correct, $amntdevil! The answer was "72".

#SETUP

---

## Installation

1. **Clone the repository**
```bash
git clone https://github.com/AMNTDEVIL/quiz_twitch_chat_game.git
cd twitch-quiz-bot

2. **Install dependencies**

npm install


3. Create a .env file in the project root with your Twitch credentials:

TWITCH_BOT_USERNAME=your_bot_username
TWITCH_OAUTH_TOKEN=oauth:your_twitch_oauth_token
TWITCH_CHANNEL=#your_channel

4. Add your quiz questions in questions.json:
[
  { "question": "What is 2 + 2?", "answer": "4" },
  { "question": "Capital of France?", "answer": "Paris" }
]
#Usage

*Join a game

!play


*Start a game (streamer only)

!start


*Answer a question

!answer <your answer>


*View current scores

!scoreboard


*End the game (streamer only)

!end

How It Works

1.The bot reads questions from questions.json.

2. Players join the next game using !play.

3. The streamer starts the game with !start.

4.Questions are asked one at a time. Only players who joined can answer.

5.Correct answers give points. First to 5 points wins.

6.Scoreboard shows the current ranking of players.

7.Game resets after someone wins or streamer ends the game.
## Example Chat Interaction

