#!/bin/bash

# スクリプトが実行される場所に応じてrootユーザーで実行することが必要です
if [ "$EUID" -ne 0 ]
  then echo "Please run as root"
  exit
fi

# 現在の作業ディレクトリを取得
CURRENT_DIR=$(pwd)

# 現在のユーザーを取得
CURRENT_USER=$USER

echo "Step 1: パッケージのインストール"
sudo apt-get update
sudo apt-get install -y libx11-dev libxkbcommon-x11-0 libatk-bridge2.0-0 libnss3 libxss1 libasound2 libgbm1 libgtk-3-0 libx11-xcb1 libxcomposite1 libxcursor1 libxi6 libxtst6 libnss3-dev libatk1.0-0 libatk-bridge2.0-0 libcups2 libxrandr2

echo "Step 2: Node.jsのインストール"
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt-get install -y nodejs

echo "Step 3: Puppeteerのインストール"
# srcディレクトリに移動して必要ソフトをインストール
cd "$CURRENT_DIR/src"
npm install puppeteer
npm install express

echo "Step 4: DISPLAY変数の自動設定"
# DISPLAY環境変数を~/.bashrcに追加
sudo -u "$CURRENT_USER" bash -c "grep -qxF 'export DISPLAY=:0' ~/.bashrc || echo 'export DISPLAY=:0' >> ~/.bashrc"
sudo -u "$CURRENT_USER" bash -c "source ~/.bashrc"

echo "Step 5: systemdサービスの作成"
# APIサーバーのsystemdサービスファイルを作成
cat <<EOL > /etc/systemd/system/api-server.service
[Unit]
Description=Node.js API Server
After=network.target

[Service]
ExecStart=/usr/bin/node $CURRENT_DIR/src/api-server.js
WorkingDirectory=$CURRENT_DIR/src
Restart=always
User=$CURRENT_USER
Environment=DISPLAY=:0
Environment=PATH=/usr/bin:/usr/local/bin
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOL

echo "Step 6: サービスの有効化と起動"
# サービスを有効化し、自動起動設定
sudo systemctl daemon-reload
sudo systemctl enable api-server
sudo systemctl start api-server

echo "セットアップ完了"
