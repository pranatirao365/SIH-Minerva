import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import WebView from 'react-native-webview';
import { ArrowLeft } from '../../components/Icons';
import { COLORS } from '../../constants/styles';

// Embedded Silica Survivor game HTML
const SILICA_SURVIVOR_HTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Silica Survivor - Safety Training Game</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            font-family: 'Arial', sans-serif;
            color: #fff;
        }

        .game-container {
            position: relative;
            width: 100%;
            max-width: 500px;
            height: 100vh;
            background: #0f3460;
            border: 3px solid #e94560;
            box-shadow: 0 0 20px rgba(233, 69, 96, 0.5);
            overflow: hidden;
            display: flex;
            flex-direction: column;
        }

        canvas {
            display: block;
            background: #0f3460;
            flex: 1;
            width: 100%;
        }

        .ui-overlay {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 10;
        }

        .health-bar-container {
            position: absolute;
            top: 15px;
            left: 15px;
            width: 200px;
            z-index: 20;
        }

        .health-label {
            font-size: 12px;
            color: #ffd700;
            margin-bottom: 5px;
            font-weight: bold;
        }

        .health-bar {
            width: 100%;
            height: 20px;
            background: #333;
            border: 2px solid #ffd700;
            border-radius: 5px;
            overflow: hidden;
        }

        .health-fill {
            height: 100%;
            background: linear-gradient(90deg, #ff4444, #ffaa44);
            width: 100%;
            transition: width 0.3s ease;
        }

        .timer-container {
            position: absolute;
            top: 15px;
            right: 15px;
            font-size: 24px;
            font-weight: bold;
            color: #ffd700;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
            z-index: 20;
        }

        .popup {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.95);
            border: 3px solid #e94560;
            border-radius: 10px;
            padding: 30px;
            max-width: 400px;
            text-align: center;
            z-index: 1000;
            animation: popupFadeIn 0.4s ease;
            box-shadow: 0 0 30px rgba(233, 69, 96, 0.8);
        }

        @keyframes popupFadeIn {
            from {
                opacity: 0;
                transform: translate(-50%, -50%) scale(0.8);
            }
            to {
                opacity: 1;
                transform: translate(-50%, -50%) scale(1);
            }
        }

        @keyframes popupFadeOut {
            from {
                opacity: 1;
                transform: translate(-50%, -50%) scale(1);
            }
            to {
                opacity: 0;
                transform: translate(-50%, -50%) scale(0.8);
            }
        }

        .popup.fade-out {
            animation: popupFadeOut 0.4s ease;
        }

        .popup-title {
            font-size: 20px;
            font-weight: bold;
            color: #e94560;
            margin-bottom: 15px;
        }

        .popup-message {
            font-size: 16px;
            color: #fff;
            line-height: 1.5;
        }

        .game-over-screen {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.95);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 2000;
            animation: fadeIn 0.5s ease;
        }

        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }

        .game-over-content {
            text-align: center;
            color: #fff;
        }

        .game-over-title {
            font-size: 48px;
            font-weight: bold;
            color: #e94560;
            margin-bottom: 20px;
            text-shadow: 0 0 20px rgba(233, 69, 96, 0.8);
        }

        .game-over-message {
            font-size: 20px;
            margin-bottom: 30px;
            line-height: 1.6;
        }

        .game-over-buttons {
            display: flex;
            gap: 15px;
            justify-content: center;
            flex-wrap: wrap;
        }

        button {
            padding: 12px 30px;
            font-size: 16px;
            font-weight: bold;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            transition: all 0.3s ease;
        }

        .btn-primary {
            background: #e94560;
            color: white;
        }

        .btn-primary:hover {
            background: #ff5577;
            transform: scale(1.05);
        }

        .info-box {
            position: absolute;
            bottom: 15px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.8);
            border: 1px solid #ffd700;
            border-radius: 5px;
            padding: 10px 15px;
            font-size: 12px;
            color: #ffd700;
            text-align: center;
            z-index: 20;
        }
    </style>
</head>
<body>
    <div class="game-container">
        <canvas id="gameCanvas" width="500" height="700"></canvas>
        
        <div class="ui-overlay">
            <div class="health-bar-container">
                <div class="health-label">HEALTH</div>
                <div class="health-bar">
                    <div class="health-fill" id="healthFill"></div>
                </div>
            </div>
            
            <div class="timer-container" id="timer">20</div>
            
            <div class="info-box">
                Use Arrow Keys or A/D to move
            </div>
        </div>
    </div>

    <script>
        const CANVAS_WIDTH = 500;
        const CANVAS_HEIGHT = 700;
        const PLAYER_SIZE = 40;
        const PLAYER_SPEED = 6;
        const GAME_DURATION = 20;
        const MAX_HEALTH = 3;

        const gameState = {
            isRunning: false,
            isPaused: false,
            health: MAX_HEALTH,
            timeLeft: GAME_DURATION,
            score: 0,
            gameOver: false,
            gameWon: false,
        };

        const canvas = document.getElementById('gameCanvas');
        const ctx = canvas.getContext('2d');

        const player = {
            x: CANVAS_WIDTH / 2 - PLAYER_SIZE / 2,
            y: CANVAS_HEIGHT - 80,
            width: PLAYER_SIZE,
            height: PLAYER_SIZE,
            velocityX: 0,
            speed: PLAYER_SPEED,

            update() {
                if (this.x < 0) this.x = 0;
                if (this.x + this.width > CANVAS_WIDTH) {
                    this.x = CANVAS_WIDTH - this.width;
                }
                this.x += this.velocityX;
            },

            draw() {
                ctx.fillStyle = '#00ff00';
                ctx.fillRect(this.x, this.y, this.width, this.height);

                ctx.fillStyle = '#ffdbac';
                ctx.beginPath();
                ctx.arc(
                    this.x + this.width / 2,
                    this.y + 12,
                    8,
                    0,
                    Math.PI * 2
                );
                ctx.fill();

                ctx.strokeStyle = '#00aa00';
                ctx.lineWidth = 2;
                ctx.strokeRect(this.x, this.y, this.width, this.height);
            },
        };

        class EyeIrritantGas {
            constructor() {
                this.x = Math.random() * (CANVAS_WIDTH - 50);
                this.y = -50;
                this.width = 50;
                this.height = 50;
                this.speed = 2;
            }

            update() {
                this.y += this.speed;
            }

            draw() {
                ctx.fillStyle = 'rgba(255, 100, 100, 0.6)';
                ctx.beginPath();
                ctx.arc(this.x + 25, this.y + 25, 25, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = 'rgba(255, 150, 150, 0.4)';
                ctx.beginPath();
                ctx.arc(this.x + 10, this.y + 20, 15, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(this.x + 40, this.y + 20, 15, 0, Math.PI * 2);
                ctx.fill();
            }

            collidesWith(rect) {
                return !(
                    this.x + this.width < rect.x ||
                    this.x > rect.x + rect.width ||
                    this.y + this.height < rect.y ||
                    this.y > rect.y + rect.height
                );
            }
        }

        class LungDamagingGas {
            constructor() {
                this.x = Math.random() * (CANVAS_WIDTH - 80);
                this.y = -80;
                this.width = 80;
                this.height = 80;
                this.speed = 1;
            }

            update() {
                this.y += this.speed;
            }

            draw() {
                ctx.fillStyle = 'rgba(50, 50, 50, 0.7)';
                ctx.beginPath();
                ctx.arc(this.x + 40, this.y + 40, 40, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = 'rgba(20, 20, 20, 0.5)';
                ctx.beginPath();
                ctx.arc(this.x + 15, this.y + 30, 25, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(this.x + 65, this.y + 30, 25, 0, Math.PI * 2);
                ctx.fill();
            }

            collidesWith(rect) {
                return !(
                    this.x + this.width < rect.x ||
                    this.x > rect.x + rect.width ||
                    this.y + this.height < rect.y ||
                    this.y > rect.y + rect.height
                );
            }
        }

        let eyeIrritantGases = [];
        let lungDamagingGases = [];

        function handleEyeIrritantCollision() {
            gameState.health--;
            updateHealthBar();
            pauseAndShowPopup(
                'Eyes Burning!',
                'Your eyes are burning!\\nWear protective goggles!'
            );
        }

        function handleLungDamagingCollision() {
            gameState.health--;
            updateHealthBar();
            pauseAndShowPopup(
                'Lungs Damaged!',
                'Silica is damaging your lungs!\\nWear a dust mask immediately!'
            );
        }

        function updateHealthBar() {
            const healthPercent = (gameState.health / MAX_HEALTH) * 100;
            document.getElementById('healthFill').style.width = healthPercent + '%';
        }

        function pauseAndShowPopup(title, message) {
            gameState.isPaused = true;

            const popup = document.createElement('div');
            popup.className = 'popup';
            popup.innerHTML = '<div class="popup-title">' + title + '</div><div class="popup-message">' + message + '</div>';
            document.body.appendChild(popup);

            setTimeout(() => {
                popup.classList.add('fade-out');
                
                setTimeout(() => {
                    popup.remove();
                    gameState.isPaused = false;
                }, 400);
            }, 2000);
        }

        let spawnTimer = 0;
        const SPAWN_INTERVAL = 80;

        function spawnEnemies() {
            spawnTimer++;

            if (spawnTimer > SPAWN_INTERVAL) {
                const rand = Math.random();
                if (rand < 0.6) {
                    eyeIrritantGases.push(new EyeIrritantGas());
                } else {
                    lungDamagingGases.push(new LungDamagingGas());
                }
                spawnTimer = 0;
            }
        }

        function update() {
            if (gameState.isPaused || gameState.gameOver || gameState.gameWon) return;

            handleInput();
            player.update();

            eyeIrritantGases.forEach((gas, index) => {
                gas.update();

                if (gas.collidesWith(player)) {
                    handleEyeIrritantCollision();
                    eyeIrritantGases.splice(index, 1);
                }

                if (gas.y > CANVAS_HEIGHT) {
                    eyeIrritantGases.splice(index, 1);
                }
            });

            lungDamagingGases.forEach((gas, index) => {
                gas.update();

                if (gas.collidesWith(player)) {
                    handleLungDamagingCollision();
                    lungDamagingGases.splice(index, 1);
                }

                if (gas.y > CANVAS_HEIGHT) {
                    lungDamagingGases.splice(index, 1);
                }
            });

            spawnEnemies();

            if (gameState.health <= 0) {
                gameState.gameOver = true;
                showGameOver(false);
            }

            if (gameState.timeLeft <= 0) {
                gameState.gameWon = true;
                showGameOver(true);
            }
        }

        function draw() {
            ctx.fillStyle = '#0f3460';
            ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

            ctx.strokeStyle = 'rgba(100, 100, 150, 0.1)';
            ctx.lineWidth = 1;
            for (let i = 0; i < CANVAS_WIDTH; i += 50) {
                ctx.beginPath();
                ctx.moveTo(i, 0);
                ctx.lineTo(i, CANVAS_HEIGHT);
                ctx.stroke();
            }
            for (let i = 0; i < CANVAS_HEIGHT; i += 50) {
                ctx.beginPath();
                ctx.moveTo(0, i);
                ctx.lineTo(CANVAS_WIDTH, i);
                ctx.stroke();
            }

            player.draw();

            eyeIrritantGases.forEach((gas) => gas.draw());
            lungDamagingGases.forEach((gas) => gas.draw());
        }

        function showGameOver(won) {
            const overlay = document.createElement('div');
            overlay.className = 'game-over-screen';

            let title = won ? 'You Survived!' : 'Game Over';
            let message = won
                ? 'Great job! Protect yourself from silica with goggles and masks.'
                : 'Your health has been compromised. Always wear protective equipment!';
            let titleColor = won ? '#00ff00' : '#e94560';

            overlay.innerHTML = '<div class="game-over-content"><div class="game-over-title" style="color: ' + titleColor + ';">' + title + '</div><div class="game-over-message">' + message + '</div><div class="game-over-buttons"><button class="btn-primary" onclick="location.reload()">Play Again</button></div></div>';

            document.body.appendChild(overlay);
        }

        function updateTimer() {
            if (!gameState.isPaused && gameState.isRunning && !gameState.gameOver && !gameState.gameWon) {
                gameState.timeLeft--;
                document.getElementById('timer').textContent = gameState.timeLeft;
            }
        }

        function gameLoop() {
            update();
            draw();
            requestAnimationFrame(gameLoop);
        }

        const keys = {};

        window.addEventListener('keydown', (e) => {
            keys[e.key.toLowerCase()] = true;
        });

        window.addEventListener('keyup', (e) => {
            keys[e.key.toLowerCase()] = false;
        });

        function handleInput() {
            player.velocityX = 0;

            if (keys['arrowleft'] || keys['a']) {
                player.velocityX = -player.speed;
            }
            if (keys['arrowright'] || keys['d']) {
                player.velocityX = player.speed;
            }
        }

        function initGame() {
            gameState.isRunning = true;
            gameState.health = MAX_HEALTH;
            gameState.timeLeft = GAME_DURATION;
            gameState.gameOver = false;
            gameState.gameWon = false;
            eyeIrritantGases = [];
            lungDamagingGases = [];
            updateHealthBar();
            gameLoop();

            setInterval(updateTimer, 1000);
        }

        window.addEventListener('load', () => {
            initGame();
        });
    </script>
</body>
</html>
`;

export default function GameWebView() {
  const router = useRouter();
  const { gameTitle } = useLocalSearchParams<{ gameUrl?: string; gameTitle?: string }>();
  const [loading, setLoading] = useState(false);

  const handleGoBack = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
          <ArrowLeft size={24} color={COLORS.primary} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>{gameTitle || 'Silica Survivor'}</Text>

        <View style={styles.spacer} />
      </View>

      {/* WebView with Game */}
      <View style={styles.webViewContainer}>
        <WebView
          source={{ html: SILICA_SURVIVOR_HTML }}
          style={styles.webView}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          onError={() => setLoading(false)}
          scalesPageToFit={true}
          scrollEnabled={false}
          javaScriptEnabled={true}
        />

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Loading {gameTitle}...</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  title: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  spacer: {
    width: 32,
  },
  webViewContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  webView: {
    flex: 1,
    width: '100%',
  },
  loadingContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    width: '100%',
    height: '100%',
  },
  loadingText: {
    color: COLORS.text,
    marginTop: 16,
    fontSize: 14,
  },
});
