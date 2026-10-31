/**
 * User-selected starter candidates, not an Instagram popularity ranking.
 * Official pages verify names/credits only. No copyrighted audio was collected.
 * MV links are references, never the timestamp origin of an uploaded audio file.
 */
const checkedAt='2026-10-31';
const official=(url,title,kind='official')=>({url,title,kind,checkedAt});
const seed=(id,title,artist,source,movementFamily,direction,extra={})=>({
 id,title,artist,versionLabel:'原曲候補・音源未照合',metadataStatus:'verified',metadataCheckedAt:checkedAt,
 sources:[source],officialUrl:source.url,officialVideoUrl:null,
 duration:null,bpm:null,beats:[],accents:[],chorusStart:null,chorusEnd:null,recommendedClips:{},
 analysisStatus:'unverified',analysisMethod:null,analyzedAt:null,
 character:'制作提案（音源未解析）：'+direction,
 danceStyle:'オリジナル振付の制作提案。公式振付の確認・抽出結果ではありません。',movementFamily,
 ...extra
});
export const initialMuseSongs=[
 seed('watashi-ichiban-kawaii','わたしの一番かわいいところ','FRUITS ZIPPER',official('https://asobisystem.com/news/26457/','FRUITS ZIPPER 2ndデジタルシングル公式リリース案内'),'cute','顔まわりの小さな手振りと左右ステップで、可愛い表情の切り替えを見せる。',{versionLabel:'2022年デジタル原曲候補・音源未照合',metadataNotes:'2023年シングルCD版・ライブ版・速度変更版とは音源を照合して別バージョン管理する。'}),
 seed('kawaikute-gomen','可愛くてごめん','HoneyWorks',official('https://www.youtube.com/watch?v=K4xLi8IF1FM','HoneyWorks OFFICIAL「可愛くてごめん feat. ちゅーたん（CV：早見沙織）」'),'confident','カメラに目を合わせた自信のある微笑みと、頬の横の小さなポーズ。',{versionLabel:'feat. ちゅーたん（CV：早見沙織）候補・音源未照合',officialVideoUrl:'https://www.youtube.com/watch?v=K4xLi8IF1FM',metadataNotes:'かぴ歌唱版・高嶺のなでしこ公式カバー版と混同しない。HoneyWorksは制作名義、参照MVの歌唱はちゅーたん（CV：早見沙織）。'}),
 seed('magnetic','Magnetic','ILLIT',official('https://www.youtube.com/watch?v=Vk5-c_v4gMU','HYBE LABELS「ILLIT Magnetic Official MV」'),'groove','滑らかな重心移動とコンパクトな手の動きを組み合わせる。',{officialVideoUrl:'https://www.youtube.com/watch?v=Vk5-c_v4gMU',versionLabel:'SUPER REAL ME 韓国語原曲候補・音源未照合'}),
 seed('kawaii-dake-ja-dame','かわいいだけじゃだめですか？','CUTIE STREET',official('https://asobisystem.com/talent/cutiestreet/','ASOBISYSTEM CUTIE STREET公式アーティストページ・MV一覧'),'cute','左右のステップと目線の変化を使い、顔が見える小さなポーズを主役にする。',{officialVideoUrl:'https://www.youtube.com/watch?v=jZqTz1G8G04',metadataNotes:'日本語原曲候補。韓国語版・ライブ版・MV版と音源を照合する。'}),
 seed('super-shy','Super Shy','NewJeans',official('https://www.youtube.com/watch?v=ArmDp-zijuc','HYBE LABELS「NewJeans Super Shy Official MV」'),'airy','軽い足運びと柔らかな肩の動きで、親しみやすい笑顔をつなぐ。',{officialVideoUrl:'https://www.youtube.com/watch?v=ArmDp-zijuc',versionLabel:'Get Up 原曲候補・音源未照合'}),
 seed('new-kawaii','NEW KAWAII','FRUITS ZIPPER',official('https://fruitszipper.asobisystem.com/discography/detail/3780/','FRUITS ZIPPER「NEW KAWAII / フルーツバスケット」公式ディスコグラフィー'),'confident','胸を開いた立ち姿と手のひらの向きで、前向きな表情を見せる。',{sources:[official('https://fruitszipper.asobisystem.com/discography/detail/3780/','FRUITS ZIPPER「NEW KAWAII / フルーツバスケット」公式ディスコグラフィー'),official('https://fruitszipper.asobisystem.com/news/detail/25457','FRUITS ZIPPER「NEW KAWAII」公式VIDEOページ')],metadataNotes:'2024年アルバム版とシングル版は照合前。参照ページを見ただけでは同一タイムスタンプと扱わない。'}),
 seed('saijokyu-kawaii','最上級にかわいいの！','超ときめき♡宣伝部',official('https://avex.jp/cho-tokisen/saijyoukyuunikawaiino/','avex「最上級にかわいいの！」公式リリース特設ページ'),'cute','表情アップと全身の小さなステップを交互に使い、最後に照れ笑いで止める。',{versionLabel:'2024年シングル原曲候補・音源未照合'}),
 seed('baibai-fight','倍倍FIGHT!','CANDY TUNE',official('https://candytune.asobisystem.com/news/detail/42570','CANDY TUNE「倍倍FIGHT!」公式VIDEOページ'),'bouncy','左右へ弾むステップと肩の軽い上下動、拍で決まる明るいポーズ。',{officialVideoUrl:'https://www.youtube.com/watch?v=9HKbo1FstOE',metadataNotes:'タイトル末尾は公式表記の半角 ! を使用。MVの時刻を原曲へ転記しない。'}),
 seed('hitamuki-cinderella','ひたむきシンデレラ！','CUTIE STREET',official('https://asobisystem.com/talent/cutiestreet/','ASOBISYSTEM CUTIE STREET公式アーティストページ・MV一覧'),'airy','スカートや袖の自然な揺れを生かし、小さな一歩と振り向きで展開する。',{officialVideoUrl:'https://www.youtube.com/watch?v=AtDErGSpfYQ',requestedTitle:'ひたむきシンデレラ！',metadataNotes:'公式MV一覧で末尾の「！」を確認。ライブ版と区別する。'}),
 seed('ai-scream','愛♡スクリ～ム！','AiScReam',official('https://www.lovelive-anime.jp/special/AiScReam/','ラブライブ！公式 AiScReam特設サイト'),'cute','問いかける目線、頬の横の手振り、笑顔の静止を一つずつ見せる。',{versionLabel:'2025年デビューシングル原曲候補・音源未照合',metadataNotes:'AiScReamの大文字・小文字と曲名の♡・～・！を公式特設ページの表記に合わせた。ライブ版や短縮版は別バージョン。'}),
 seed('fruits-basket','フルーツバスケット','FRUITS ZIPPER',official('https://fruitszipper.asobisystem.com/discography/detail/3780/','FRUITS ZIPPER「NEW KAWAII / フルーツバスケット」公式ディスコグラフィー'),'bouncy','片手ずつの小さなジェスチャーと弾む足運びで、見せ場の密度を変える。',{officialVideoUrl:'https://www.youtube.com/watch?v=bRRPqGRguKo',versionLabel:'2024年シングル原曲候補・音源未照合'}),
 seed('zenhoko-bishojo','全方向美少女','乃紫',official('https://www.youtube.com/watch?v=HSzlq9slRdo','乃紫 Official Artist Channel 正規配信「全方向美少女」','distribution'),'confident','正面・斜めの顔の向きをつなぎ、自然なアイコンタクトで姿勢を決める。',{officialVideoUrl:'https://www.youtube.com/watch?v=1qxsgGso_sE',versionLabel:'2024年デジタルシングル原曲候補・音源未照合',sources:[official('https://www.youtube.com/watch?v=HSzlq9slRdo','乃紫 Official Artist Channel 正規配信「全方向美少女」','distribution'),official('https://www.youtube.com/watch?v=1qxsgGso_sE','乃紫(noa) 公式MV「全方向美少女 / Any angle」')],metadataNotes:'MVの英語題表記 Any angle と日本語配信題 全方向美少女を区別して記録。時刻原点は未照合。'}),
 seed('bibbidiba','ビビデバ','星街すいせい',official('https://hololive.hololivepro.com/music/407/','hololive公式リリース音源「星街すいせい ビビデバ」'),'sharp','小さく切れのある足運び、肩の角度、手首の向きでメリハリを作る。',{versionLabel:'2024年3月原曲候補・音源未照合',metadataNotes:'公式ページにRemix別リンクあり。BloodPop® Remixなどは別バージョンとして解析する。'}),
 seed('apt','APT.','ROSÉ & Bruno Mars',official('https://music.apple.com/us/album/apt-single/1773452219','Apple Music「APT. - Single」ROSÉ & Bruno Mars','distribution'),'bouncy','上半身の軽い弾みと短いステップを交互に置き、強い拍で笑顔を決める。',{versionLabel:'2024年シングル原曲候補・音源未照合',sources:[official('https://music.apple.com/us/album/apt-single/1773452219','Apple Music「APT. - Single」ROSÉ & Bruno Mars','distribution'),official('https://www.youtube.com/watch?v=58-AKkNMZNQ','ROSÉ Official Artist Channel 正規配信「APT.」','distribution')],metadataNotes:'共演者表記と末尾のピリオドを正規配信で確認。ライブ版や速度変更版は別解析。'}),
 seed('hi-five','Hi-Five','ME:I',official('https://me-i.jp/feature/hi-five','ME:I 2nd Single「Hi-Five」公式特設ページ'),'bouncy','片手のあいさつ、左右ステップ、目線の戻しで明るい展開を作る。',{versionLabel:'2024年2ndシングル原曲候補・音源未照合',metadataNotes:'アーティスト表記 ME:I、曲名 Hi-Five。インストゥルメンタル版と歌唱版は別管理。'}),
 seed('ii-jan','イイじゃん','M!LK',official('https://ebidan.jp/news/detail/10002535','EBiDAN公式「M!LK イイじゃん MUSIC VIDEO」'),'confident','一歩で向きを変え、肩と目線のアクセントを短く決める。',{officialVideoUrl:'https://www.youtube.com/watch?v=GW-XMhRQDFI',metadataNotes:'M!LKの ! を含む公式表記を確認。ライブ版やMV版の時間軸と混同しない。'}),
 seed('attitude','ATTITUDE','IVE',official('https://www.youtube.com/watch?v=1qiWRF6tWWo','IVE Official Artist Channel 正規配信「ATTITUDE」','distribution'),'confident','重心を低く保った小さなステップと、首・肩の穏やかな角度変化を使う。',{versionLabel:'IVE EMPATHY 韓国語原曲候補・音源未照合',metadataNotes:'正規配信でIVE・ATTITUDEを確認。公式振付の動作やサビ時刻は抽出していない。'}),
 seed('whiplash','Whiplash','aespa',official('https://www.youtube.com/watch?v=jWQx2f-CErU','SMTOWN「aespa Whiplash MV」'),'sharp','肩の小さな分離動作と足の接地を明確にし、手振りを短く切り替える。',{officialVideoUrl:'https://www.youtube.com/watch?v=jWQx2f-CErU',versionLabel:'2024年韓国語原曲候補・音源未照合',metadataNotes:'English Ver.・Remix・ライブ版は原曲と別バージョンとして扱う。'}),
 seed('perfect-night','Perfect Night','LE SSERAFIM',official('https://www.youtube.com/watch?v=hLvWy2b857I','HYBE LABELS「LE SSERAFIM Perfect Night OFFICIAL M/V with OVERWATCH 2」'),'groove','ゆるい横移動と腕の滑らかな流れで、自然に笑う余韻を残す。',{officialVideoUrl:'https://www.youtube.com/watch?v=hLvWy2b857I',versionLabel:'2023年英語デジタルシングル原曲候補・音源未照合',metadataNotes:'MVは映像の参照。原曲音声・別編集の時刻原点は照合前。'}),
 seed('catch-catch','Catch Catch','YENA',official('https://www.youtube.com/watch?v=NOiyDlWl534','STONE MUSIC「YENA (최예나) - 캐치 캐치 (Catch Catch) MV」'),'bouncy','小さな追いかけるような足運びと、目線の引き戻しで遊び心を出す。',{versionLabel:'LOVE CATCHER 韓国語原曲候補・音源未照合',metadataNotes:'2026年3月の韓国語原曲候補。Catch Catch (Chinese Ver.) は別バージョン。韓国語MV題：캐치 캐치 (Catch Catch)。',officialVideoUrl:'https://www.youtube.com/watch?v=NOiyDlWl534'})
];

// Verified public YouTube references. Video/audio timing remains unverified.
const youtubeReferences={
 'watashi-ichiban-kawaii':['NQUo3vITjgY','KAWAII LAB.'],
 'kawaikute-gomen':['K4xLi8IF1FM','HoneyWorks OFFICIAL'],
 'magnetic':['Vk5-c_v4gMU','HYBE LABELS'],
 'kawaii-dake-ja-dame':['jZqTz1G8G04','KAWAII LAB.'],
 'super-shy':['ArmDp-zijuc','HYBE LABELS'],
 'new-kawaii':['7Am9TCA3WrA','KAWAII LAB.'],
 'saijokyu-kawaii':['Y4KjiTGBggw','超ときめき♡宣伝部サブチャンネル'],
 'baibai-fight':['9HKbo1FstOE','KAWAII LAB.'],
 'hitamuki-cinderella':['AtDErGSpfYQ','KAWAII LAB.'],
 'ai-scream':['L1mFVp9IM9c','ラブライブ！シリーズ公式 / Official Lyric Video'],
 'fruits-basket':['bRRPqGRguKo','KAWAII LAB.'],
 'zenhoko-bishojo':['1qxsgGso_sE','乃紫(noa)'],
 'bibbidiba':['xRl-RPv5bU8','Hoshimachi Suisei - Topic / 正規配信音源'],
 'apt':['ekr2nIex040','ROSÉ'],
 'hi-five':['2uU7cWfnuKw','ME:I'],
 'ii-jan':['GW-XMhRQDFI','M!LK'],
 'attitude':['38xYeot-ciM','STARSHIP'],
 'whiplash':['jWQx2f-CErU','SMTOWN'],
 'perfect-night':['hLvWy2b857I','HYBE LABELS'],
 'catch-catch':['NOiyDlWl534','STONE MUSIC']
};
for(const song of initialMuseSongs){const row=youtubeReferences[song.id];if(!row)continue;const url='https://www.youtube.com/watch?v='+row[0];song.officialVideoUrl=url;song.youtubeChannel=row[1];if(!song.sources.some(s=>s.url===url))song.sources.push({url,title:song.title+' / '+row[1]+'（YouTube参照・時刻未検証）',kind:song.id==='bibbidiba'?'distribution':'official',checkedAt});}
