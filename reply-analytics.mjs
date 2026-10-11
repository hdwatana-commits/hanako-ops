export function analyticsRate(success,total){return total>0?100*success/total:null;}
export function analyticsAdvice(data){
 const [current,previous]=data.periods||[];if(!current)return ['集計データを確認できませんでした。'];
 const tips=[];const q=data.queue||{};
 if(q.uncertain>0)tips.push(`公開結果が不明な返信が${q.uncertain}件あります。再送前にThreadsで確認してください。`);
 if(q.failed>0)tips.push(`現在の失敗${q.failed}件は、原因を確認してから再試行してください。`);
 if(current.conversation_eligible<20)tips.push('会話継続率は観測済みの自動返信が20件未満です。まだ良し悪しを判断せず、データを集めましょう。');
 else if(previous?.conversation_eligible>=20){const delta=analyticsRate(current.conversation_returned,current.conversation_eligible)-analyticsRate(previous.conversation_returned,previous.conversation_eligible);tips.push(`会話継続率は前期間比${delta>=0?'+':''}${delta.toFixed(1)}ポイントです。投稿の話題や相手の違いもあるため、返信方法だけの効果とは断定できません。`);}
 if(current.revisit_eligible<20)tips.push('再訪率は対象者が20人未満です。初回観測から7日間を確認できる人が増えるまで判断を保留します。');
 if(current.unclassified_replies>0)tips.push(`自動・手動の区別が未記録の過去返信${current.unclassified_replies}件は、自動返信の指標から除外しています。`);
 tips.push('次の実験案：投稿の話題を揃え、返信の質問あり／なしの1点だけを比較する。会話継続率を確認してから設定を変える。');
 return tips;
}
export function renderReplyAnalytics(target,data){
 const node=(tag,text)=>{const e=document.createElement(tag);e.textContent=text;return e;};
 const date=value=>new Date(value).toLocaleDateString('ja-JP',{timeZone:'Asia/Tokyo'});
 const rate=(n,d)=>{const p=analyticsRate(n,d);return p===null?'未集計（0件）':`${p.toFixed(1)}%（${n}/${d}）`;};
 target.replaceChildren();target.append(node('p','集計日時：'+new Date(data.generated_at).toLocaleString('ja-JP',{timeZone:'Asia/Tokyo'})));
 const table=document.createElement('table');table.style.width='100%';
 const head=document.createElement('tr');['指標','直近7日（今日を除く）','その前の7日'].forEach(x=>head.append(node('th',x)));table.append(head);
 const [a,b]=data.periods||[];if(!a)return;
 const rows=[['期間',p=>date(p.start_at)+'〜'+date(new Date(Date.parse(p.end_at)-86400000))],['相手のコメント',p=>`${p.comments}件 / ${p.people}人`],['確認済み自動返信',p=>`${p.auto_replies}件`],['会話継続率（48時間）',p=>rate(p.conversation_returned,p.conversation_eligible)],['継続の観測待ち',p=>`${p.conversation_waiting}件`],['再訪率（7日間）',p=>rate(p.revisit_returned,p.revisit_eligible)],['再訪の初回観測期間',p=>date(new Date(Date.parse(p.start_at)-7*86400000))+'〜'+date(new Date(Date.parse(p.end_at)-8*86400000))],['返信までの中央値',p=>p.median_minutes===null?'未集計':`${Number(p.median_minutes).toFixed(1)}分`]];
 for(const [label,value] of rows){const tr=document.createElement('tr');tr.append(node('th',label),node('td',value(a)),node('td',b?value(b):'—'));table.append(tr);}
 const scroller=document.createElement('div');scroller.style.overflowX='auto';scroller.append(table);target.append(scroller);
 target.append(node('p',`現在の待機：${data.queue?.pending||0}件 / 失敗：${data.queue?.failed||0}件 / 公開結果不明：${data.queue?.uncertain||0}件`));
 const chart=document.createElement('details');chart.append(node('summary','日別のコメント・自動返信（今日を含む14日）'));
 for(const d of data.daily||[])chart.append(node('p',`${d.day}：相手のコメント ${d.comments}件 / 確認済み自動返信 ${d.auto_replies}件`));target.append(chart);
 target.append(node('h4','今週の確認・改善案'));const ul=document.createElement('ul');analyticsAdvice(data).forEach(t=>ul.append(node('li',t)));target.append(ul);
 target.append(node('p','会話継続＝自動返信から48時間以内に、同じ相手がその返信へ直接返答した割合。観測待ちは除外。再訪＝履歴で初めて確認した人が、7日以内の別の日にもコメントした割合。取得できた履歴だけの集計で、未取得の会話や履歴以前の交流は含みません。'));
 target.append(node('p','再訪は観測期間を確保するため、初回観測の対象期間を7日前へずらしています。APIの閲覧・いいね・フォロワー数、Note購入、実際の請求額はこの集計に含まれません。AI・Threadsへの追加リクエストは行いません。'));
 if(data.coverage?.oldest_comment)target.append(node('small','保存済みコメント期間：'+date(data.coverage.oldest_comment)+'〜'+date(data.coverage.latest_comment)));
}
