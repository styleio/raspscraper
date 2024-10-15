#!/bin/bash

# スクリプトが実行される場所に応じてrootユーザーで実行することが必要です
if [ "$EUID" -ne 0 ]
  then echo "Please run as root"
  exit
fi

# 現在の作業ディレクトリを取得
CURRENT_DIR=$(pwd)

# 現在のユーザーを取得
CURRENT_USER=${SUDO_USER:-$USER}

echo "Step 1: xvfb(仮想ディスプレイ)のインストール"
sudo apt-get update
sudo apt-get install -y xvfb

echo "Step 2: systemdサービスの作成"
# APIサーバーのsystemdサービスファイルを作成
cat <<EOL > /etc/systemd/system/xvfb.service
[Unit]
Description=Start Xvfb at startup
After=network.target

[Service]
ExecStart=/usr/bin/Xvfb :99 -screen 0 1024x768x24
Restart=always
User=$CURRENT_USER
Environment=DISPLAY=:99

[Install]
WantedBy=multi-user.target
EOL

echo "Step 3: サービスの有効化と起動"
sudo systemctl daemon-reload
sudo systemctl enable xvfb
sudo systemctl start xvfb

echo "Step 4: DISPLAY変数の変更"

# DISPLAY環境変数を~/.bashrcに置換または追加
sudo -u "$CURRENT_USER" bash -c "
if grep -q 'export DISPLAY=:0' ~/.bashrc; then
  sed -i 's/export DISPLAY=:0/export DISPLAY=:99/' ~/.bashrc
else
  grep -qxF 'export DISPLAY=:99' ~/.bashrc || echo 'export DISPLAY=:99' >> ~/.bashrc
fi
"

# ~/.bashrc を再読み込みして変更を反映
sudo -u "$CURRENT_USER" bash -c "source ~/.bashrc"


echo "セットアップ完了"
