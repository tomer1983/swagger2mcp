"""
Test UI Server
Run this to test your API endpoints via a web interface

Usage: python test-ui/server.py
Then open http://localhost:3001 in your browser
"""

import os
import json
from pathlib import Path
from http.server import HTTPServer, SimpleHTTPRequestHandler
import httpx

PORT = int(os.environ.get("TEST_UI_PORT", 3001))
API_BASE_URL = os.environ.get("API_BASE_URL", "https://petstore.swagger.io/v2")

class TestUIHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(Path(__file__).parent), **kwargs)
    
    def do_POST(self):
        if self.path == "/api/call":
            content_length = int(self.headers.get("Content-Length", 0))
            body = json.loads(self.rfile.read(content_length))
            
            tool = body.get("tool")
            args = body.get("arguments", {})
            api_key = self.headers.get("X-API-Key", "")
            
            headers = {}
            if api_key:
                headers["Authorization"] = f"Bearer {api_key}"
            
            try:
                result = self.call_tool(tool, args, headers)
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.send_header("Access-Control-Allow-Origin", "*")
                self.end_headers()
                self.wfile.write(json.dumps(result).encode())
            except Exception as e:
                self.send_response(500)
                self.send_header("Content-Type", "application/json")
                self.send_header("Access-Control-Allow-Origin", "*")
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode())
        else:
            self.send_response(404)
            self.end_headers()
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, X-API-Key")
        self.end_headers()
    
    def call_tool(self, tool: str, args: dict, headers: dict):
        if False:
            pass
        elif tool == "uploadFile":
            params = {}
            url = f"{API_BASE_URL}/pet/{args.get('petId', '')}/uploadImage"
            response = httpx.post(url, params=params, headers=headers)
            return response.json()
        elif tool == "addPet":
            params = {}
            url = f"{API_BASE_URL}/pet"
            response = httpx.post(url, params=params, json=args.get("body"), headers=headers)
            return response.json()
        elif tool == "updatePet":
            params = {}
            url = f"{API_BASE_URL}/pet"
            response = httpx.put(url, params=params, json=args.get("body"), headers=headers)
            return response.json()
        elif tool == "findPetsByStatus":
            params = {"status": args.get("status")}
            url = f"{API_BASE_URL}/pet/findByStatus"
            response = httpx.get(url, params=params, headers=headers)
            return response.json()
        elif tool == "findPetsByTags":
            params = {"tags": args.get("tags")}
            url = f"{API_BASE_URL}/pet/findByTags"
            response = httpx.get(url, params=params, headers=headers)
            return response.json()
        elif tool == "getPetById":
            params = {}
            url = f"{API_BASE_URL}/pet/{args.get('petId', '')}"
            response = httpx.get(url, params=params, headers=headers)
            return response.json()
        elif tool == "updatePetWithForm":
            params = {}
            url = f"{API_BASE_URL}/pet/{args.get('petId', '')}"
            response = httpx.post(url, params=params, headers=headers)
            return response.json()
        elif tool == "deletePet":
            params = {}
            url = f"{API_BASE_URL}/pet/{args.get('petId', '')}"
            response = httpx.delete(url, params=params, headers=headers)
            return response.json()
        elif tool == "getInventory":
            params = {}
            url = f"{API_BASE_URL}/store/inventory"
            response = httpx.get(url, params=params, headers=headers)
            return response.json()
        elif tool == "placeOrder":
            params = {}
            url = f"{API_BASE_URL}/store/order"
            response = httpx.post(url, params=params, json=args.get("body"), headers=headers)
            return response.json()
        elif tool == "getOrderById":
            params = {}
            url = f"{API_BASE_URL}/store/order/{args.get('orderId', '')}"
            response = httpx.get(url, params=params, headers=headers)
            return response.json()
        elif tool == "deleteOrder":
            params = {}
            url = f"{API_BASE_URL}/store/order/{args.get('orderId', '')}"
            response = httpx.delete(url, params=params, headers=headers)
            return response.json()
        elif tool == "createUsersWithListInput":
            params = {}
            url = f"{API_BASE_URL}/user/createWithList"
            response = httpx.post(url, params=params, json=args.get("body"), headers=headers)
            return response.json()
        elif tool == "getUserByName":
            params = {}
            url = f"{API_BASE_URL}/user/{args.get('username', '')}"
            response = httpx.get(url, params=params, headers=headers)
            return response.json()
        elif tool == "updateUser":
            params = {}
            url = f"{API_BASE_URL}/user/{args.get('username', '')}"
            response = httpx.put(url, params=params, json=args.get("body"), headers=headers)
            return response.json()
        elif tool == "deleteUser":
            params = {}
            url = f"{API_BASE_URL}/user/{args.get('username', '')}"
            response = httpx.delete(url, params=params, headers=headers)
            return response.json()
        elif tool == "loginUser":
            params = {"username": args.get("username"), "password": args.get("password")}
            url = f"{API_BASE_URL}/user/login"
            response = httpx.get(url, params=params, headers=headers)
            return response.json()
        elif tool == "logoutUser":
            params = {}
            url = f"{API_BASE_URL}/user/logout"
            response = httpx.get(url, params=params, headers=headers)
            return response.json()
        elif tool == "createUsersWithArrayInput":
            params = {}
            url = f"{API_BASE_URL}/user/createWithArray"
            response = httpx.post(url, params=params, json=args.get("body"), headers=headers)
            return response.json()
        elif tool == "createUser":
            params = {}
            url = f"{API_BASE_URL}/user"
            response = httpx.post(url, params=params, json=args.get("body"), headers=headers)
            return response.json()
        else:
            raise ValueError(f"Unknown tool: {tool}")


def main():
    server = HTTPServer(("", PORT), TestUIHandler)
    print(f"\n🧪 Test UI running at http://localhost:{PORT}")
    print(f"📡 Proxying API calls to: {API_BASE_URL}\n")
    server.serve_forever()


if __name__ == "__main__":
    main()
