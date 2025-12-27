$body = @{
    email = "test.new@gmail.com"
    firstName = "Test"
    lastName = "New"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:3000/api/recipients" -Method POST -Headers @{"Content-Type"="application/json"} -Body $body

$response | ConvertTo-Json -Depth 5
