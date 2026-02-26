$ErrorActionPreference = "Stop"
$screens = @(
    @{
        name = "01_home_screen"
        html = "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ7Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpaCiVodG1sXzJhYzQyYzNkZjM0MDQ2OTZhOTkwYjYwYjgzMzUyOWUwEgsSBxDKrPXH1Q4YAZIBIwoKcHJvamVjdF9pZBIVQhMxMDM0OTQxNDM4NzE1MjA0MTg2&filename=&opi=89354086"
        img = "https://lh3.googleusercontent.com/aida/AOfcidWFRs0ZBNF--cvpqr18vwcN_8gKE5zyZh_W7QGz3bA0q0Dq_Wr0fPoAM8JYgePC_d0LUHkl6eDizzyWW4DVP0NevHwi9BWy0n2JI3BnbicOVj9Tk3CU_Gh1f_PuzYR4WTxIg40fdKf0TMwchuLUlCvDaL3-RUxafV6JXu53V0Q5ecuU4lbSF6q1KPO3dOPg97Y1WrXxnUfQke1ZtaDjXcXzKBeqHTLa46ndLzccynIwToSgSWwNGllMPYg"
    },
    @{
        name = "02_product_details"
        html = "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ7Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpaCiVodG1sXzdjYmJlNWQ4YWI0OTQwODQ4MjFmOTJiM2RkMDJiNjg3EgsSBxDKrPXH1Q4YAZIBIwoKcHJvamVjdF9pZBIVQhMxMDM0OTQxNDM4NzE1MjA0MTg2&filename=&opi=89354086"
        img = "https://lh3.googleusercontent.com/aida/AOfcidV_IUOsoI7_wO21ovP-06dfPMAX7s3Eu1dbW6_NCb8ybwptLgyjH9g5SEqapUXt5Y1FaaRVGHpTF3tPC5-HuA-tgtKdQDL_SIQWOgI53BgrRI5S4yzHbrBQmtNvnrcnxcJUKuHxGE4KyyldfS2zCIwB7YFXDHoM1tewQ7laYHR-xIThDzUCgm52YBj96DX1lfmrH-zhkFJxwR4paNAvUIAiE5olOWu-DPehj6_QhrjaiUV8QUg6xkPbJG8"
    },
    @{
        name = "03_shopping_bag"
        html = "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ7Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpaCiVodG1sX2U1NjRlNGZjZjg4ZDQ5MzM4NWI0NjYzNDFiYzczM2Y4EgsSBxDKrPXH1Q4YAZIBIwoKcHJvamVjdF9pZBIVQhMxMDM0OTQxNDM4NzE1MjA0MTg2&filename=&opi=89354086"
        img = "https://lh3.googleusercontent.com/aida/AOfcidXUr7cP9cuM_k_XRborPkzLXX5Q7fJH85QBezmvI7o_sOZqYtVUc0LBQJcDoULAjtDYxoYeXDaJC7Y4puaA8dwuEztDMDW0lFnt7Ub0cYfjV23XYcBEE15VXg2b-gWk2Gocdcffd5L15MFT0bNrqhd-koIbry2ZnpQvBL6P5ASEu665rPXdMZJNBGwLhN63SXIh_fHYGvhIlw4xbmO-9NEEBBf5EX-sCnOPj9_-uxooZj5zaXTD--bTyLY"
    },
    @{
        name = "04_checkout"
        html = "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ7Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpaCiVodG1sXzkyM2Y5MmE2MDVhYTQ2MmJhOTlhNjQzNzQxNjUyMTZlEgsSBxDKrPXH1Q4YAZIBIwoKcHJvamVjdF9pZBIVQhMxMDM0OTQxNDM4NzE1MjA0MTg2&filename=&opi=89354086"
        img = "https://lh3.googleusercontent.com/aida/AOfcidX8uYBuxrM7puAWyJGbkAtmi72VzfcyHd-y9lZhW3jRJzKwWD-m4_6RqR7EPQ9934p9lS1SsXP75MfgGlebTObASILDdeGUDtmF5lLeX7ICi5xBYpv_B5ROVY_DfNiXBtXcwqKUpVSf1KzT870IM9rwYXgECrj8nmUv1kSfVPra8vipZ-cUFWgt3kletqmwkCKs37kyUs8iJcv-B52Ym7x7DhqjQKcsBXZqG5Ngy4U3OmrAfnzKkDMP8w"
    },
    @{
        name = "05_admin_dashboard"
        html = "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ7Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpaCiVodG1sX2RmOTg0ZGI3NDMwZjRkY2FhNjdhMmNlZTUyZDY3OGE4EgsSBxDKrPXH1Q4YAZIBIwoKcHJvamVjdF9pZBIVQhMxMDM0OTQxNDM4NzE1MjA0MTg2&filename=&opi=89354086"
        img = "https://lh3.googleusercontent.com/aida/AOfcidWMM4mX_ucWDmMlkSKXgeqrAwe1cAz3OnsQVjBPmKI4B2KRDHhxIdb476FznRbh_dxrr-IUq44yYUye4z4DgwN-sv8YciQMKZ8eBZEpqsvZq47WqaGfy3TjiqjZU3afPk8F75kV6ECTkDKTXyd7x3ky4F_kyEDkQAOtQK6R7VkZO_f4ZFbuvKBbqEi2MsP25Kss6BCV81u-iNkrF5rFKIxU_bLja_Ehxp4oKZTcPONHFVumcpOmy_qLPw"
    },
    @{
        name = "06_admin_products"
        html = "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ7Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpaCiVodG1sX2E5MGE0YWU5NjUyMTQyMTM5NWZmN2Q0YzllM2NjYzYzEgsSBxDKrPXH1Q4YAZIBIwoKcHJvamVjdF9pZBIVQhMxMDM0OTQxNDM4NzE1MjA0MTg2&filename=&opi=89354086"
        img = "https://lh3.googleusercontent.com/aida/AOfcidVv5z7xCi3CQCxdUSfTCw7ikBWKMKLx1sFBhrWn7JweAv7ai-3zv8eXQX6TzTMjX05Qmazi6qHUILaK-usydP9el0apbnXcGFNtl26kGMCbR8eLYWjPq5KykVqdM9NUb7WZITP-UQ8oroTovBMDHkNUfSnwpp8WL0NGCT1zibTnbzeSNLJteQwdBGlEB96lY5453_6eXMZFk4Iiw3j9HGIScntvI0HgC9x9XtrxDK1iqj-BZciFR10oFMk"
    }
)

foreach ($s in $screens) {
    Write-Host "Downloading $($s.name)..."
    Invoke-WebRequest -Uri $s.html -OutFile "$($s.name).html"
    Invoke-WebRequest -Uri $s.img -OutFile "$($s.name).png"
}
Write-Host "Done downloading screens."
