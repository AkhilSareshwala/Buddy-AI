$ErrorActionPreference = "Continue"
$json = '{"chapter_id":"any-random-uuid-123","messages":[{"role":"user","content":"hi"}],"student_id":"test"}'
try {
    $r = Invoke-WebRequest -Uri 'http://localhost:8000/chat' -Method POST -Body $json -ContentType 'application/json' -Headers @{'Authorization'='Bearer buddyai_secret_key_123'} -TimeoutSec 30
    Write-Host "Status:" $r.StatusCode
} catch {
    Write-Host "Exception:" $_.Exception.GetType().FullName
    Write-Host "Message:" $_.Exception.Message
    if ($_.Exception.Response) {
        Write-Host "StatusCode:" $_.Exception.Response.StatusCode
    }
}