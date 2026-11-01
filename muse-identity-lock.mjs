/** Shared visual-reference priority. This generates instructions, not a face-match guarantee. */
const label=value=>String(value??'').replace(/[\u0000-\u001f\u007f]/g,' ').trim().slice(0,180);
export const museIdentityHelp='顔の基準は、最初に登録した元の本人画像です。CUT 2以降も毎回、同じ元画像を開始画像と一緒にMUSEへ添付してください。前カットの画像は姿勢・構図の参考です。元画像と顔が違う終了画像は次へ引き継がず、元画像から修正し、必要なら該当カットも作り直してから接続します。画像を1枚しか渡せない画面では、元画像から作り、顔の一致を確認した開始画像を使ってください。';

export function originalIdentityLock(names){
 const sources=(Array.isArray(names)?names:[names]).map(label).filter(Boolean).slice(0,10);
 const primary=sources[0]||'the original uploaded identity photo (attach it before generation)';
 return `CRITICAL — ORIGINAL PHOTO IDENTITY LOCK / HIGHEST VISUAL PRIORITY
PRIMARY FACE SOURCE: ${primary}.
The original uploaded identity photo is the sole authority for facial identity in EVERY CUT and EVERY FRAME, including CUT 2 and all later CUTs, start images, ending images and transitions. Re-anchor directly to this SAME ORIGINAL PHOTO for each separate generation. Never use an earlier generated face as a new identity baseline.
${sources.length>1?`Additional original reference labels: ${sources.slice(1).join(' / ')}. Use these only as views of the same person; the PRIMARY FACE SOURCE wins any conflict. Never blend different faces.`:''}
Preserve the original recognizable facial geometry and visible features: face width and proportions, eye shape and spacing, eyelids, eyebrows, nose bridge and tip, lips, cheeks, jawline, chin, skin texture and distinguishing marks. Do not recast, average, beautify, age, slim or redesign the face. No face replacement, facial morphing, progressive identity drift, reference-dancer resemblance or carryover of a changed face from a prior generation.
Natural smiles, blinking, gaze changes, mouth movement and head rotation are allowed when directed. Keep the SAME underlying facial anatomy through those expressions; do not freeze the face, and do not redraw its structure when smiling or turning.
Previous ending frames and generated keyframes supply POSE, COMPOSITION, CLOTHING and LIGHT CONTINUITY ONLY; they do not override the original photo's face. Motion-reference performers supply movement only. This identity lock takes priority over style suggestions, buzz presentation, choreography notes and pasted plans wherever facial appearance conflicts.
Attach the SAME ORIGINAL PHOTO again with the approved start keyframe for EVERY CUT whenever multiple image inputs are available. If there is only one image slot, use a start keyframe made from this original photo whose facial identity has been checked against it. Do not pretend a filename is an attached image; request the missing original/reference before proceeding when the identity cannot be established.
FINAL IDENTITY CHECK: compare the beginning, middle and end of this CUT directly with the original photo, not just the preceding CUT. If the face changes, regenerate the affected CUT from the original before joining. A changed face must never be propagated into the next CUT.`;
}

export function verifiedIdentityContinuity(previous,next){
 return `IDENTITY-CHECKED CONTINUITY: Before using ${label(previous)} as ${label(next)}, compare its face directly with the PRIMARY FACE SOURCE. ONLY if the face still matches the original, reuse an exact copy of the approved ending frame as the next start; preserve its pose, crop, clothes and lighting. If its face has drifted, do NOT reuse it unchanged: correct the ending/start keyframe from the ORIGINAL identity photo while keeping the intended body pose and composition, and regenerate any affected video CUT before joining. Generated continuity frames are pose references, never a replacement face source.`;
}
