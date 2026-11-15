# Proveedor TTS local (Windows SAPI / System.Speech). Gratis y offline.
# Uso: powershell -File sapi.ps1 -InputJson <ruta>
# El JSON de entrada: { text, voice, rate, outWav, outJson }
# Escribe un WAV y un JSON con los límites de palabra (posición en caracteres + tiempo en ms).
param([Parameter(Mandatory = $true)][string]$InputJson)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Speech

$cfg = Get-Content -Raw -Encoding UTF8 $InputJson | ConvertFrom-Json
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer

$available = $synth.GetInstalledVoices() | Where-Object { $_.Enabled } | ForEach-Object { $_.VoiceInfo.Name }
if ($cfg.voice) {
  if ($available -notcontains $cfg.voice) {
    throw "Voz '$($cfg.voice)' no instalada. Disponibles: $($available -join ', ')"
  }
  $synth.SelectVoice($cfg.voice)
}
$synth.Rate = [int]$cfg.rate

# IMPORTANTE: a 16 kHz las posiciones de SpeakProgress coinciden con el audio real.
# Con 22,05/44,1 kHz SAPI reporta tiempos escalados (comprobado con silencedetect).
$format = New-Object System.Speech.AudioFormat.SpeechAudioFormatInfo(16000, [System.Speech.AudioFormat.AudioBitsPerSample]::Sixteen, [System.Speech.AudioFormat.AudioChannel]::Mono)
$synth.SetOutputToWaveFile($cfg.outWav, $format)

$words = New-Object System.Collections.ArrayList
$handler = Register-ObjectEvent -InputObject $synth -EventName SpeakProgress -Action {
  $e = $EventArgs
  [void]$Event.MessageData.Add([pscustomobject]@{
      charPos   = $e.CharacterPosition
      charCount = $e.CharacterCount
      text      = $e.Text
      ms        = [math]::Round($e.AudioPosition.TotalMilliseconds, 1)
    })
} -MessageData $words

$synth.Speak([string]$cfg.text)
# Dar tiempo a que se procesen los eventos pendientes
Start-Sleep -Milliseconds 200
Unregister-Event -SourceIdentifier $handler.Name
$synth.SetOutputToNull()
$synth.Dispose()

[pscustomobject]@{ voice = $cfg.voice; words = @($words) } | ConvertTo-Json -Depth 4 | Set-Content -Encoding UTF8 $cfg.outJson
