"""
Tool implementations for MCP server.

Each function corresponds to an API endpoint.
"""

import os
import httpx
from typing import Any

from .models import *

# Configuration
BASE_URL = os.environ.get("API_BASE_URL", "https://petstore.swagger.io/v2")

API_KEY = os.environ.get("API_KEY", "")

def get_auth_headers() -> dict[str, str]:
    return {"Authorization": f"Bearer {API_KEY}"} if API_KEY else {}

# Async HTTP client
client = httpx.AsyncClient(
    base_url=BASE_URL,
    headers=get_auth_headers(),
    timeout=30.0,
)


async def uploadFile(args: UploadFileInput) -> dict[str, Any]:
    """uploads an image"""
    url = f"/pet/{args.petId}/uploadImage"
    response = await client.post(url)
    response.raise_for_status()
    return response.json()


async def addPet(args: AddPetInput) -> dict[str, Any]:
    """Add a new pet to the store"""
    json_data = args.body.model_dump() if hasattr(args.body, "model_dump") else args.body
    url = "/pet"
    response = await client.post(url, json=json_data)
    response.raise_for_status()
    return response.json()


async def updatePet(args: UpdatePetInput) -> dict[str, Any]:
    """Update an existing pet"""
    json_data = args.body.model_dump() if hasattr(args.body, "model_dump") else args.body
    url = "/pet"
    response = await client.put(url, json=json_data)
    response.raise_for_status()
    return response.json()


async def findPetsByStatus(args: FindPetsByStatusInput) -> dict[str, Any]:
    """Finds Pets by status"""
    params = {"status": args.status}
    url = "/pet/findByStatus"
    response = await client.get(url, params=params)
    response.raise_for_status()
    return response.json()


async def findPetsByTags(args: FindPetsByTagsInput) -> dict[str, Any]:
    """Finds Pets by tags"""
    params = {"tags": args.tags}
    url = "/pet/findByTags"
    response = await client.get(url, params=params)
    response.raise_for_status()
    return response.json()


async def getPetById(args: GetPetByIdInput) -> dict[str, Any]:
    """Find pet by ID"""
    url = f"/pet/{args.petId}"
    response = await client.get(url)
    response.raise_for_status()
    return response.json()


async def updatePetWithForm(args: UpdatePetWithFormInput) -> dict[str, Any]:
    """Updates a pet in the store with form data"""
    url = f"/pet/{args.petId}"
    response = await client.post(url)
    response.raise_for_status()
    return response.json()


async def deletePet(args: DeletePetInput) -> dict[str, Any]:
    """Deletes a pet"""
    url = f"/pet/{args.petId}"
    response = await client.delete(url)
    response.raise_for_status()
    return response.json()


async def getInventory(args: GetInventoryInput) -> dict[str, Any]:
    """Returns pet inventories by status"""
    url = "/store/inventory"
    response = await client.get(url)
    response.raise_for_status()
    return response.json()


async def placeOrder(args: PlaceOrderInput) -> dict[str, Any]:
    """Place an order for a pet"""
    json_data = args.body.model_dump() if hasattr(args.body, "model_dump") else args.body
    url = "/store/order"
    response = await client.post(url, json=json_data)
    response.raise_for_status()
    return response.json()


async def getOrderById(args: GetOrderByIdInput) -> dict[str, Any]:
    """Find purchase order by ID"""
    url = f"/store/order/{args.orderId}"
    response = await client.get(url)
    response.raise_for_status()
    return response.json()


async def deleteOrder(args: DeleteOrderInput) -> dict[str, Any]:
    """Delete purchase order by ID"""
    url = f"/store/order/{args.orderId}"
    response = await client.delete(url)
    response.raise_for_status()
    return response.json()


async def createUsersWithListInput(args: CreateUsersWithListInputInput) -> dict[str, Any]:
    """Creates list of users with given input array"""
    json_data = args.body.model_dump() if hasattr(args.body, "model_dump") else args.body
    url = "/user/createWithList"
    response = await client.post(url, json=json_data)
    response.raise_for_status()
    return response.json()


async def getUserByName(args: GetUserByNameInput) -> dict[str, Any]:
    """Get user by user name"""
    url = f"/user/{args.username}"
    response = await client.get(url)
    response.raise_for_status()
    return response.json()


async def updateUser(args: UpdateUserInput) -> dict[str, Any]:
    """Updated user"""
    json_data = args.body.model_dump() if hasattr(args.body, "model_dump") else args.body
    url = f"/user/{args.username}"
    response = await client.put(url, json=json_data)
    response.raise_for_status()
    return response.json()


async def deleteUser(args: DeleteUserInput) -> dict[str, Any]:
    """Delete user"""
    url = f"/user/{args.username}"
    response = await client.delete(url)
    response.raise_for_status()
    return response.json()


async def loginUser(args: LoginUserInput) -> dict[str, Any]:
    """Logs user into the system"""
    params = {"username": args.username, "password": args.password}
    url = "/user/login"
    response = await client.get(url, params=params)
    response.raise_for_status()
    return response.json()


async def logoutUser(args: LogoutUserInput) -> dict[str, Any]:
    """Logs out current logged in user session"""
    url = "/user/logout"
    response = await client.get(url)
    response.raise_for_status()
    return response.json()


async def createUsersWithArrayInput(args: CreateUsersWithArrayInputInput) -> dict[str, Any]:
    """Creates list of users with given input array"""
    json_data = args.body.model_dump() if hasattr(args.body, "model_dump") else args.body
    url = "/user/createWithArray"
    response = await client.post(url, json=json_data)
    response.raise_for_status()
    return response.json()


async def createUser(args: CreateUserInput) -> dict[str, Any]:
    """Create user"""
    json_data = args.body.model_dump() if hasattr(args.body, "model_dump") else args.body
    url = "/user"
    response = await client.post(url, json=json_data)
    response.raise_for_status()
    return response.json()
