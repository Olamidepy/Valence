Add-Type -AssemblyName System.Drawing

$srcPath = "c:\Users\ACER\Valence\public\image.png"
$bmp = [System.Drawing.Bitmap]::FromFile($srcPath)
$width = $bmp.Width
$height = $bmp.Height

Write-Host "Source image dimensions: $width x $height"

# Find non-transparent pixels per column
$colHasPixel = New-Object bool[] $width
for ($x = 0; $x -lt $width; $x++) {
    for ($y = 0; $y -lt $height; $y++) {
        $pixel = $bmp.GetPixel($x, $y)
        if ($pixel.A -gt 20) {
            $colHasPixel[$x] = $true
            break
        }
    }
}

# Find contiguous ranges of columns with content
$ranges = New-Object System.Collections.ArrayList
$inRange = $false
$start = 0

for ($x = 0; $x -lt $width; $x++) {
    if ($colHasPixel[$x] -and -not $inRange) {
        $inRange = $true
        $start = $x
    } elseif (-not $colHasPixel[$x] -and $inRange) {
        $inRange = $false
        [void]$ranges.Add(@{ Start = $start; End = ($x - 1) })
    }
}
if ($inRange) {
    [void]$ranges.Add(@{ Start = $start; End = ($width - 1) })
}

Write-Host "Found $($ranges.Count) content ranges:"
for ($i = 0; $i -lt $ranges.Count; $i++) {
    Write-Host "Range $i : $($ranges[$i].Start) to $($ranges[$i].End)"
}

# Helper to find vertical bounds for a given horizontal range
function Get-VerticalBounds($bmp, $startX, $endX) {
    $minY = $bmp.Height
    $maxY = 0
    for ($x = $startX; $x -le $endX; $x++) {
        for ($y = 0; $y -lt $bmp.Height; $y++) {
            $pixel = $bmp.GetPixel($x, $y)
            if ($pixel.A -gt 20) {
                if ($y -lt $minY) { $minY = $y }
                if ($y -gt $maxY) { $maxY = $y }
            }
        }
    }
    return @{ MinY = $minY; MaxY = $maxY }
}

# Helper to crop and save
function Save-Crop($bmp, $rect, $outputPath) {
    $cropBmp = New-Object System.Drawing.Bitmap($rect.Width, $rect.Height)
    $g = [System.Drawing.Graphics]::FromImage($cropBmp)
    $g.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $destRect = New-Object System.Drawing.Rectangle(0, 0, $rect.Width, $rect.Height)
    $g.DrawImage($bmp, $destRect, $rect, [System.Drawing.GraphicsUnit]::Pixel)
    $g.Dispose()
    $cropBmp.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $cropBmp.Dispose()
    Write-Host "Saved: $outputPath ($($rect.Width)x$($rect.Height))"
}

# Crop 1: Robinhood Logo + Wordmark (x from 92 to 1451)
$v1 = Get-VerticalBounds $bmp 92 1451
$rect1 = New-Object System.Drawing.Rectangle(92, $v1.MinY, (1451 - 92 + 1), ($v1.MaxY - $v1.MinY + 1))
Save-Crop $bmp $rect1 "c:\Users\ACER\Valence\public\robinhood-logo.png"

# Crop 2: Circular Orbital Logo (x from 1502 to 1896)
$v2 = Get-VerticalBounds $bmp 1502 1896
$rect2 = New-Object System.Drawing.Rectangle(1502, $v2.MinY, (1896 - 1502 + 1), ($v2.MaxY - $v2.MinY + 1))
Save-Crop $bmp $rect2 "c:\Users\ACER\Valence\public\circular-logo.png"

$bmp.Dispose()
Write-Host "Done splitting!"
