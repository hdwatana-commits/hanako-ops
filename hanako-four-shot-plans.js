/* Shared by the three four-photo preset buttons; no network or image generation. */
globalThis.HanakoFourShotPlans = (() => {
  const frames = {
    environmentWide: ['空気まで映す引き', '35mm相当、目の高さから環境を含む全身。人物は画面の左寄り', '両腕を自然に下ろし、横へ半歩だけ重心を移す。目線は進行方向'],
    approachFull: ['正面の小さな一歩', '50mm相当、正面の全身。頭頂と足元に余白', '片足を小さく前へ置き、肩は脱力。目が合った瞬間の微笑み'],
    sideFull: ['横向きのシルエット', '70mm相当、横からの全身。向いている側に余白', '身体をほぼ横に向け、両手は身体の前で軽く重ねる。カメラを見ず横顔で笑う'],
    diagonalFull: ['斜めからのコーデ', '35mm相当、目の高さの斜め45度から全身。背景の奥行きを使う', '前後の足へ自然に体重を分け、片手を腰より低く開く。視線を少し上へ'],
    profilePortrait: ['静かな横顔', '85mm相当、横から腰上。顔の向いた側へ広い余白', '腕を体の横で休ませ、窓など元の光の方向へ静かに目を向ける'],
    lookbackPortrait: ['肩越しの一瞬', '70mm相当、背面斜めから膝上。首を無理にひねらない', '身体を進行方向へ向けたまま、肩越しに軽く目線を戻す。片手は自然に下ろす'],
    closeEye: ['目が合う寄り', '85mm相当、目の高さから肩まで入れるポートレート', '顎を引きすぎず、両肩を自然に保つ。手を顔へ添えず、瞳と小さな笑顔を主役にする'],
    highSmile: ['少し上からの笑顔', '50mm相当、目線より少し高い位置から斜めの腰上', '片方の肩を少し引き、目だけでカメラを見上げて笑う。両手は腰より下'],
    handsLead: ['手の仕草から表情へ', '50mm相当、斜めの腰上。手元から顔へ視線を導くが顔にもピント', '腰の高さで片方の指先をもう一方の手に軽く添え、視線を手元から戻す途中'],
    sleeveCheck: ['身支度の小さな仕草', '70mm相当、正面から膝上。腕の動きと服の形が分かる画角', '袖口を片手で軽く整えて視線を落とす。袖がなければ手首に軽く触れる。衣服の形は変えない'],
    hairSweep: ['髪に触れる瞬間', '70mm相当、斜めから腰上。顔の輪郭と片腕が収まる', '片手の指先を耳の横の髪へ軽く添える。髪型をほどかず、カメラから少し視線を外す'],
    claspFront: ['手を重ねた照れ笑い', '50mm相当、正面から膝上。人物は中央より少し右', '両手を身体の前の低い位置で重ね、顔をわずかに下へ。目元で照れたように笑う'],
    handsBehind: ['後ろ手の小さな間', '50mm相当、斜めから膝上。顔と肩を自然な大きさで写す', '両手を背中側の低い位置で軽く組み、まっすぐ立つ。首だけ少し傾けて目を合わせる'],
    halfTurn: ['半分振り向く動き', '50mm相当、目の高さから全身。身体の回転方向に余白', '正面と横の中間へ身体をゆっくり向ける途中。片腕は動きに合わせて自然に揺れる'],
    sideGlance: ['斜めの視線', '85mm相当、顔の斜め30度から肩上。頭頂と顎に余白', '顔は斜めのまま、目だけをカメラの少し横へ向ける。口元は穏やかに緩める'],
    laughAway: ['ふっと笑った瞬間', '70mm相当、横斜めから胸より上。肩と髪の広がりも残す', 'カメラから少し顔を外して自然に笑う。口を手で隠さず、肩の動きで楽しさを表す'],
    gestureHello: ['小さく手を振る', '50mm相当、正面から腰上。振る手の指先に余白', '片手を肩より低く上げ、小さく手を振る途中。反対の腕は下ろし、柔らかな目線を向ける'],
    curiousTilt: ['気になって首を傾ける', '85mm相当、正面から肩上。瞳へ正確にピント', '首をほんの少しだけ傾け、眉をわずかに上げる。頬杖や指ハートは付け足さない'],
    walkingPast: ['横を通り過ぎるスナップ', '35mm相当、人物の横から全身。自然な歩幅と安全な足元', '横へ小さく一歩移る途中を捉える。目線は少し先へ、両腕は歩幅に合わせて自然に'],
    pauseProfile: ['立ち止まった横姿', '70mm相当、横斜めから全身。背景の線と人物を少しずらす', '足をそろえて静かに止まり、顎を少しだけ光へ向ける。両手は身体の横'],
    openPalm: ['発見をそっと伝える', '70mm相当、斜めから腰上。顔と低い位置の手が一緒に入る', '片手のひらを腰の高さで少し開き、何かを話し始めるような表情。小物や相手の手を追加しない'],
    shoulderAngle: ['肩の角度で見せる', '85mm相当、目の高さから肩と顔。身体に対しカメラは斜め', '片方の肩を少し前へ向け、顔はほぼ正面へ。落ち着いた柔らかな微笑み'],
    lookDownHair: ['うつむきからの余白', '70mm相当、斜め後方寄りから膝上。顔が隠れない角度', '視線を足元の少し先へ落とし、片手は髪の毛先の近くで休める。髪型は維持'],
    stillCentered: ['まっすぐな一枚', '50mm相当、正面の全身。左右の余白を整えた静かな構図', '背筋を自然に伸ばし、両腕を身体の横へ。重心を片足に寄せすぎず穏やかに目を合わせる'],
  };
  const definitions = [
    ['streetRhythm', '引きから始まる日常スナップ', ['environmentWide','halfTurn','sideGlance','handsBehind']],
    ['closeToWide', '寄りから広がる可愛さ', ['curiousTilt','walkingPast','claspFront','diagonalFull']],
    ['softProfile', '横顔と小さなご挨拶', ['profilePortrait','gestureHello','sideFull','closeEye']],
    ['handsAndSmile', '手元と笑顔のリズム', ['handsLead','laughAway','approachFull','lookDownHair']],
    ['candidFour', 'ふいに笑うオフショット', ['laughAway','diagonalFull','hairSweep','pauseProfile']],
    ['quietEditorial', '静かなファッション誌', ['stillCentered','shoulderAngle','sleeveCheck','profilePortrait']],
    ['littleHello', '手を振るところから', ['gestureHello','sideFull','curiousTilt','walkingPast']],
    ['sideToFront', '横姿から目が合うまで', ['pauseProfile','halfTurn','closeEye','openPalm']],
    ['walkingDiary', '半歩ずつの写真日記', ['walkingPast','lookbackPortrait','handsLead','highSmile']],
    ['gentleAngles', 'やさしい角度の変化', ['highSmile','claspFront','environmentWide','sideGlance']],
    ['turningScene', '振り向く途中の一瞬', ['halfTurn','lookDownHair','stillCentered','laughAway']],
    ['fashionDetail', '身支度から見せるコーデ', ['sleeveCheck','diagonalFull','shoulderAngle','gestureHello']],
    ['calmToLaugh', '照れから笑顔へ', ['claspFront','profilePortrait','approachFull','laughAway']],
    ['playfulBeat', '小さな仕草の連続', ['openPalm','hairSweep','walkingPast','curiousTilt']],
    ['lensRhythm', '肩越しから変わる距離', ['lookbackPortrait','highSmile','sideFull','handsLead']],
    ['cleanSilhouette', '横向きコーデと素顔', ['sideFull','closeEye','halfTurn','sleeveCheck']],
  ];
  const modes = ['threads','instagramIndoor','instagramOuting'];
  const plans = definitions.map(([id,label,ids]) => Object.freeze({id,label,shots:Object.freeze(ids.map(key=>Object.freeze({id:key,label:frames[key][0],camera:frames[key][1],pose:frames[key][2]})))}));
  const get = (id,mode) => modes.includes(mode) ? plans.find(plan=>plan.id===id)||null : null;
  function choose(mode, previous={}, random=Math.random) {
    if(!modes.includes(mode))throw new Error('4枚セットの種類を確認してください');
    if(!previous||typeof previous!=='object')previous={};
    const valid = values => Array.isArray(values) ? [...new Set(values.filter(id=>get(id,mode)))] : [];
    const recent = valid(previous.recent).slice(0,4);
    let remaining = valid(previous.remaining);
    if(!remaining.length)remaining=plans.map(plan=>plan.id);
    let options=remaining.filter(id=>id!==previous.id);
    if(!options.length){remaining=plans.map(plan=>plan.id);options=remaining.filter(id=>id!==previous.id);}
    const last=get(previous.id,mode);
    const score=id=>{const shots=get(id,mode).shots;return shots.reduce((n,shot,i)=>n+(shot.id===last?.shots[i]?.id?(i===0?5:2):0),0)+(recent.includes(id)?20:0);};
    const best=Math.min(...options.map(score));options=options.filter(id=>score(id)===best);
    const roll=Math.max(0,Math.min(0.999999999,Number(random())||0));
    const id=options[Math.floor(roll*options.length)];
    return {id,remaining:remaining.filter(value=>value!==id),recent:[id,...recent.filter(value=>value!==id)].slice(0,4)};
  }
  return Object.freeze({plans:Object.freeze(plans),get,choose});
})();
