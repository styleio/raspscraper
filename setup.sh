#!/bin/bash

# �X�N���v�g�����s�����ꏊ�ɉ�����root���[�U�[�Ŏ��s���邱�Ƃ��K�v�ł�
if [ "$EUID" -ne 0 ]
  then echo "Please run as root"
  exit
fi

# ���݂̍�ƃf�B���N�g�����擾
CURRENT_DIR=$(pwd)

echo "Step 1: �p�b�P�[�W�̃C���X�g�[��"
sudo apt-get update
sudo apt-get install -y libx11-dev libxkbcommon-x11-0 libatk-bridge2.0-0 libnss3 libxss1 libasound2 libgbm1 libgtk-3-0 libx11-xcb1 libxcomposite1 libxcursor1 libxi6 libxtst6 libnss3-dev libatk1.0-0 libatk-bridge2.0-0 libcups2 libxrandr2

echo "Step 2: Node.js�̃C���X�g�[��"
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt-get install -y nodejs

echo "Step 3: Puppeteer�̃C���X�g�[��"
# src�f�B���N�g���Ɉړ�����Puppeteer���C���X�g�[��
cd "$CURRENT_DIR/src"
npm install puppeteer

echo "Step 4: DISPLAY�ϐ��̎����ݒ�"
# DISPLAY���ϐ���~/.bashrc�ɒǉ�
grep -qxF 'export DISPLAY=:0' ~/.bashrc || echo 'export DISPLAY=:0' >> ~/.bashrc
source ~/.bashrc

echo "Step 5: systemd�T�[�r�X�̍쐬"
# API�T�[�o�[��systemd�T�[�r�X�t�@�C�����쐬
cat <<EOL > /etc/systemd/system/api-server.service
[Unit]
Description=Node.js API Server
After=network.target

[Service]
ExecStart=/usr/bin/node $CURRENT_DIR/src/api-server.js
WorkingDirectory=$CURRENT_DIR/src
Restart=always
User=pi
Environment=DISPLAY=:0
Environment=PATH=/usr/bin:/usr/local/bin
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOL

echo "Step 6: �T�[�r�X�̗L�����ƋN��"
# �T�[�r�X��L�������A�����N���ݒ�
sudo systemctl enable api-server
sudo systemctl start api-server

echo "�Z�b�g�A�b�v����"
