# raspscraper

ラズベリーパイ５で動作確認

以下でインストール可能です
```
git clone https://github.com/styleio/raspscraper.git
cd raspscraper
sudo sh ./setup.sh
```

ヘッドフルモード（通常のブラウザと限りなく近い形）で起動しているためディスプレイが必要です
ディスプレイを繋げない場合はxvfb(仮想ディスプレイ)を使ってください
```
sudo sh ./nondisplay.sh
```

以下はPHPのサンプルです
```
<?php

$url = "https://[アクセスしたいサイト]/";
$server = "[サーバのIP]";

// POSTデータを配列として定義
$data = array(
    'url' => $url,
    'operations' => array(
        array(
            'selector' => '#UserLOGINID',
            'value' => 'admin'
        ),
        array(
            'selector' => '#UserPASSWORD',
            'value' => '123456'
        ),
        array(
            'selector' => '#login_btn > input',
            'click' => true
        ),
        array(
            'selector' => '#main',
            'wait' => true
        ),
        array(
            'selector' => '#contents_r > div > div:nth-child(2) > dl > dd:nth-child(3) > a',
            'click' => true
        ),
        array(
            'selector' => '#main',
            'wait' => true
        ),
        
    )
);

// JSONデータに変換
$data_json = json_encode($data);

// cURLセッションを初期化
$ch = curl_init('http://'.$server.':3000/scrape');

// cURLオプションを設定
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, array('Content-Type: application/json'));
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $data_json);

// 実行して結果を取得
$response = curl_exec($ch);

// エラーチェック
if (curl_errno($ch)) {
    echo 'cURLエラー: ' . curl_error($ch);
} else {
    // レスポンスを表示
    echo 'サーバーからのレスポンス: ' . $response;
}

// cURLセッションを閉じる
curl_close($ch);
```