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

$generator = $source.Substring($start, $end - $start).TrimEnd()
$generator = $generator.Replace(
  'function generatePostText({ name, shopName, genreName, features, targetTags, catchcopy })',
  'function generatePostText({ name, shopName, genreName, features, targetTags, catchcopy, variationSeed = 0 })'
)
$generator = $generator.Replace(
  'const seed = `${name} ${catchcopy} ${featureA} ${featureB}`;',
  'const seed = `${name} ${catchcopy} ${featureA} ${featureB} variation-${variationSeed}`;'
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
    const shopName = cleanText(info && info.shopName);
    const genreName = inferCategory(`${name} ${catchcopy}`);
    const features = inferFeatures(`${name} ${catchcopy} ${genreName}`);
    const targetTags = buildTags(name, genreName, features);
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
