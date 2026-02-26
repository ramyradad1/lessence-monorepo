$urls = @{
    "home.html" = "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sX2I2YTEzNjk5MDkzZDQ3NTQ4M2Q4MzhkNmJjM2Q1NGU0EgsSBxDKrPXH1Q4YAZIBJAoKcHJvamVjdF9pZBIWQhQxNDY2NTkzMzc2MDAxMjg3NDE0OA&filename=&opi=89354086"
    "product_details.html" = "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzJhMWVjYzEzNmFkNzRmZmJhNzU4NjA0ZDBjNTFhMTBlEgsSBxDKrPXH1Q4YAZIBJAoKcHJvamVjdF9pZBIWQhQxNDY2NTkzMzc2MDAxMjg3NDE0OA&filename=&opi=89354086"
    "admin_dashboard.html" = "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzZkMDZmMWQ3OWVhNjRkNWVhYzE1NjRhODY0YjY2YzYwEgsSBxDKrPXH1Q4YAZIBJAoKcHJvamVjdF9pZBIWQhQxNDY2NTkzMzc2MDAxMjg3NDE0OA&filename=&opi=89354086"
    "cart.html" = "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzAxOWIwODA0YTEzNzRlM2Q5ODA4ZmQwODNiZjlmMDA3EgsSBxDKrPXH1Q4YAZIBJAoKcHJvamVjdF9pZBIWQhQxNDY2NTkzMzc2MDAxMjg3NDE0OA&filename=&opi=89354086"
    "checkout.html" = "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzE5NmFiNWViZTI5YzRmYTY5ZWRjMzcwN2U1NWQwNzAyEgsSBxDKrPXH1Q4YAZIBJAoKcHJvamVjdF9pZBIWQhQxNDY2NTkzMzc2MDAxMjg3NDE0OA&filename=&opi=89354086"
    "mobile_admin_dashboard.html" = "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sX2U1NjQxODI4ZjRmYjQ2ZmM5NzZiNGY0YWFjNTBkMjYwEgsSBxDKrPXH1Q4YAZIBJAoKcHJvamVjdF9pZBIWQhQxNDY2NTkzMzc2MDAxMjg3NDE0OA&filename=&opi=89354086"
    "admin_products_1.html" = "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzk1MDgxNGMxNWYxNDQ5OTlhZWI4ZjlmZmExMTQ3YjcyEgsSBxDKrPXH1Q4YAZIBJAoKcHJvamVjdF9pZBIWQhQxNDY2NTkzMzc2MDAxMjg3NDE0OA&filename=&opi=89354086"
    "admin_products_2.html" = "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzIxM2EwNzEzYjBiZTQwYjFiZDc1OGExNWRlYWI4ZmExEgsSBxDKrPXH1Q4YAZIBJAoKcHJvamVjdF9pZBIWQhQxNDY2NTkzMzc2MDAxMjg3NDE0OA&filename=&opi=89354086"
}

foreach ($item in $urls.GetEnumerator()) {
    $file = "d:\Perfumes\stitch_screens\" + $item.Name
    Write-Host "Downloading $file"
    Invoke-WebRequest -Uri $item.Value -OutFile $file
}
