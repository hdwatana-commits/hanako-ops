param(
  [string]$SourcePath = "C:\Users\hdwat\Documents\Codex\2026-06-01\30\outputs\rakuten-room-candidate-tool\server.js",
  [string]$TargetPath = (Join-Path $PSScriptRoot "..\room-review-generator.js")
)

$source = Get-Content -Raw -Encoding UTF8 $SourcePath
$startMarker = "function generatePostText"
$endMarker = "function getRakutenAppId"
$start = $source.IndexOf($startMarker, [StringComparison]::Ordinal)
$end = $source.IndexOf($endMarker, $start, [StringComparison]::Ordinal)

if ($start -lt 0 -or $end -lt 0 -or $end -le $start) {
  throw "Review generator extraction markers were not found in $SourcePath"
}

function Decode-Text([string]$Value) {
  return [System.Text.RegularExpressions.Regex]::Unescape($Value)
}

$generator = $source.Substring($start, $end - $start).TrimEnd()
$generator = $generator.Replace(
  'function generatePostText({ name, shopName, genreName, features, targetTags, catchcopy })',
  'function generatePostText({ name, shopName, genreName, features, targetTags, catchcopy, variationSeed = 0 })'
)
$generator = $generator.Replace(
  'const seed = `${name} ${catchcopy} ${featureA} ${featureB}`;',
  'const seed = `${name} ${catchcopy} ${featureA} ${featureB} variation-${variationSeed}`;'
)
$generator = $generator.Replace(
  (Decode-Text '\u9996\u5143\u306e\u958b\u304d\u3084\u8896\u4e08\u306f\u3001\u7740\u7528\u5199\u771f\u3067\u78ba\u8a8d\u3057\u305f\u3044\u3067\u3059\ud83d\udd0d'),
  (Decode-Text '\u9996\u5143\u306e\u629c\u3051\u611f\u3068\u8896\u4e08\u3067\u3001\u83ef\u5962\u898b\u3048\u3057\u3084\u3059\u3044\u306e\u304c\u9b45\u529b\u3067\u3059\u2728')
)
$generator = $generator.Replace(
  (Decode-Text '\u0022\u8896\u4e08\u3092\u78ba\u8a8d\u3057\u305f\u3044\u0022'),
  (Decode-Text '\u0022\u7d76\u5999\u306a\u8896\u4e08\u3067\u83ef\u5962\u306b\u898b\u3048\u308b\u0022')
)
$header = @'
(function () {
  "use strict";

  const MAX_POST_CHARS = 480;

'@
$footer = @'


  function generateFromInfo(info) {
    const name = cleanText(info && info.title) || "\u5546\u54c1";
    const catchcopy = cleanText(info && info.description);
    const shopName = cleanText(info && (info.shopName || info.brand));
    const suppliedGenre = cleanText(info && (info.genreName || info.category));
    const genreName = suppliedGenre || inferCategory(`${name} ${catchcopy}`);
    const features = inferFeatures(`${name} ${catchcopy} ${genreName}`);
    const targetTags = buildTags(name, genreName, features, catchcopy, shopName);
    return generatePostText({ name, shopName, genreName, features, targetTags, catchcopy, variationSeed: info && info.variationSeed });
  }

  window.RoomReviewGenerator = {
    generateFromInfo,
    generatePostText,
    inferFeatures,
    buildTags,
    inferCategory,
  };
})();
'@

$output = $header + $generator + $footer
[System.IO.File]::WriteAllText(
  [System.IO.Path]::GetFullPath($TargetPath),
  $output,
  [System.Text.UTF8Encoding]::new($false)
)

Write-Output "Synced review generator: $startMarker -> $endMarker"
