import httpx
from bs4 import BeautifulSoup
import json

url = "https://somewhere.com/jobs/apply?slug=17484142712420072484oBV"

try:
    response = httpx.get(url, follow_redirects=True)
    soup = BeautifulSoup(response.text, "html.parser")
    
    # Check for Next.js data
    next_data = soup.find("script", id="__NEXT_DATA__")
    if next_data:
        print("FOUND __NEXT_DATA__!")
        data = json.loads(next_data.string)
        print(json.dumps(data, indent=2)[:5000]) # Print first 5000 chars
    else:
        print("NO __NEXT_DATA__ found.")
        print(soup.prettify()[:1000]) # Print start of HTML

except Exception as e:
    print(f"Error: {e}")
