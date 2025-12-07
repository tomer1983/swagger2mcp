"""
Swagger Petstore
Generated MCP Server from OpenAPI specification.
"""

import os
import json
import httpx
from typing import Any, Optional
from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import Tool, TextContent

# Configuration
BASE_URL = os.environ.get("API_BASE_URL", "https://petstore.swagger.io/v2")
API_KEY = os.environ.get("API_KEY", "")

# Initialize server
server = Server("Swagger Petstore")

# HTTP client
client = httpx.Client(
    base_url=BASE_URL,
    headers={"Authorization": f"Bearer {API_KEY}"} if API_KEY else {},
    timeout=30.0,
)

# Type definitions could be generated here for complex schemas

@server.list_tools()
async def list_tools() -> list[Tool]:
    """List all available tools."""
    return [
        Tool(
            name="uploadFile",
            description="uploads an image",
            inputSchema={
                  "type": "object",
                  "properties": {
                            "petId": {
                                      "type": "string",
                                      "description": "ID of pet to update"
                            }
                  },
                  "required": [
                            "petId"
                  ]
        },
        ),
        Tool(
            name="addPet",
            description="Add a new pet to the store",
            inputSchema={
                  "type": "object",
                  "properties": {
                            "body": {
                                      "type": "object",
                                      "description": "Pet object that needs to be added to the store",
                                      "properties": {
                                                "id": {
                                                          "type": "integer",
                                                          "format": "int64"
                                                },
                                                "category": {
                                                          "type": "object",
                                                          "properties": {
                                                                    "id": {
                                                                              "type": "integer",
                                                                              "format": "int64"
                                                                    },
                                                                    "name": {
                                                                              "type": "string"
                                                                    }
                                                          },
                                                          "xml": {
                                                                    "name": "Category"
                                                          }
                                                },
                                                "name": {
                                                          "type": "string",
                                                          "example": "doggie"
                                                },
                                                "photoUrls": {
                                                          "type": "array",
                                                          "xml": {
                                                                    "wrapped": true
                                                          },
                                                          "items": {
                                                                    "type": "string",
                                                                    "xml": {
                                                                              "name": "photoUrl"
                                                                    }
                                                          }
                                                },
                                                "tags": {
                                                          "type": "array",
                                                          "xml": {
                                                                    "wrapped": true
                                                          },
                                                          "items": {
                                                                    "type": "object",
                                                                    "properties": {
                                                                              "id": {
                                                                                        "type": "integer",
                                                                                        "format": "int64"
                                                                              },
                                                                              "name": {
                                                                                        "type": "string"
                                                                              }
                                                                    },
                                                                    "xml": {
                                                                              "name": "Tag"
                                                                    }
                                                          }
                                                },
                                                "status": {
                                                          "type": "string",
                                                          "description": "pet status in the store",
                                                          "enum": [
                                                                    "available",
                                                                    "pending",
                                                                    "sold"
                                                          ]
                                                }
                                      },
                                      "required": [
                                                "name",
                                                "photoUrls"
                                      ]
                            }
                  },
                  "required": [
                            "body"
                  ]
        },
        ),
        Tool(
            name="updatePet",
            description="Update an existing pet",
            inputSchema={
                  "type": "object",
                  "properties": {
                            "body": {
                                      "type": "object",
                                      "description": "Pet object that needs to be added to the store",
                                      "properties": {
                                                "id": {
                                                          "type": "integer",
                                                          "format": "int64"
                                                },
                                                "category": {
                                                          "type": "object",
                                                          "properties": {
                                                                    "id": {
                                                                              "type": "integer",
                                                                              "format": "int64"
                                                                    },
                                                                    "name": {
                                                                              "type": "string"
                                                                    }
                                                          },
                                                          "xml": {
                                                                    "name": "Category"
                                                          }
                                                },
                                                "name": {
                                                          "type": "string",
                                                          "example": "doggie"
                                                },
                                                "photoUrls": {
                                                          "type": "array",
                                                          "xml": {
                                                                    "wrapped": true
                                                          },
                                                          "items": {
                                                                    "type": "string",
                                                                    "xml": {
                                                                              "name": "photoUrl"
                                                                    }
                                                          }
                                                },
                                                "tags": {
                                                          "type": "array",
                                                          "xml": {
                                                                    "wrapped": true
                                                          },
                                                          "items": {
                                                                    "type": "object",
                                                                    "properties": {
                                                                              "id": {
                                                                                        "type": "integer",
                                                                                        "format": "int64"
                                                                              },
                                                                              "name": {
                                                                                        "type": "string"
                                                                              }
                                                                    },
                                                                    "xml": {
                                                                              "name": "Tag"
                                                                    }
                                                          }
                                                },
                                                "status": {
                                                          "type": "string",
                                                          "description": "pet status in the store",
                                                          "enum": [
                                                                    "available",
                                                                    "pending",
                                                                    "sold"
                                                          ]
                                                }
                                      },
                                      "required": [
                                                "name",
                                                "photoUrls"
                                      ]
                            }
                  },
                  "required": [
                            "body"
                  ]
        },
        ),
        Tool(
            name="findPetsByStatus",
            description="Finds Pets by status",
            inputSchema={
                  "type": "object",
                  "properties": {
                            "status": {
                                      "type": "string",
                                      "description": "Status values that need to be considered for filter"
                            }
                  },
                  "required": [
                            "status"
                  ]
        },
        ),
        Tool(
            name="findPetsByTags",
            description="Finds Pets by tags",
            inputSchema={
                  "type": "object",
                  "properties": {
                            "tags": {
                                      "type": "string",
                                      "description": "Tags to filter by"
                            }
                  },
                  "required": [
                            "tags"
                  ]
        },
        ),
        Tool(
            name="getPetById",
            description="Find pet by ID",
            inputSchema={
                  "type": "object",
                  "properties": {
                            "petId": {
                                      "type": "string",
                                      "description": "ID of pet to return"
                            }
                  },
                  "required": [
                            "petId"
                  ]
        },
        ),
        Tool(
            name="updatePetWithForm",
            description="Updates a pet in the store with form data",
            inputSchema={
                  "type": "object",
                  "properties": {
                            "petId": {
                                      "type": "string",
                                      "description": "ID of pet that needs to be updated"
                            }
                  },
                  "required": [
                            "petId"
                  ]
        },
        ),
        Tool(
            name="deletePet",
            description="Deletes a pet",
            inputSchema={
                  "type": "object",
                  "properties": {
                            "petId": {
                                      "type": "string",
                                      "description": "Pet id to delete"
                            }
                  },
                  "required": [
                            "petId"
                  ]
        },
        ),
        Tool(
            name="getInventory",
            description="Returns pet inventories by status",
            inputSchema={
                  "type": "object",
                  "properties": {},
                  "required": []
        },
        ),
        Tool(
            name="placeOrder",
            description="Place an order for a pet",
            inputSchema={
                  "type": "object",
                  "properties": {
                            "body": {
                                      "type": "object",
                                      "description": "order placed for purchasing the pet",
                                      "properties": {
                                                "id": {
                                                          "type": "integer",
                                                          "format": "int64"
                                                },
                                                "petId": {
                                                          "type": "integer",
                                                          "format": "int64"
                                                },
                                                "quantity": {
                                                          "type": "integer",
                                                          "format": "int32"
                                                },
                                                "shipDate": {
                                                          "type": "string",
                                                          "format": "date-time"
                                                },
                                                "status": {
                                                          "type": "string",
                                                          "description": "Order Status",
                                                          "enum": [
                                                                    "placed",
                                                                    "approved",
                                                                    "delivered"
                                                          ]
                                                },
                                                "complete": {
                                                          "type": "boolean"
                                                }
                                      },
                                      "required": []
                            }
                  },
                  "required": [
                            "body"
                  ]
        },
        ),
        Tool(
            name="getOrderById",
            description="Find purchase order by ID",
            inputSchema={
                  "type": "object",
                  "properties": {
                            "orderId": {
                                      "type": "string",
                                      "description": "ID of pet that needs to be fetched"
                            }
                  },
                  "required": [
                            "orderId"
                  ]
        },
        ),
        Tool(
            name="deleteOrder",
            description="Delete purchase order by ID",
            inputSchema={
                  "type": "object",
                  "properties": {
                            "orderId": {
                                      "type": "string",
                                      "description": "ID of the order that needs to be deleted"
                            }
                  },
                  "required": [
                            "orderId"
                  ]
        },
        ),
        Tool(
            name="createUsersWithListInput",
            description="Creates list of users with given input array",
            inputSchema={
                  "type": "object",
                  "properties": {
                            "body": {
                                      "type": "array",
                                      "items": {
                                                "type": "object",
                                                "properties": {
                                                          "id": {
                                                                    "type": "integer",
                                                                    "format": "int64"
                                                          },
                                                          "username": {
                                                                    "type": "string"
                                                          },
                                                          "firstName": {
                                                                    "type": "string"
                                                          },
                                                          "lastName": {
                                                                    "type": "string"
                                                          },
                                                          "email": {
                                                                    "type": "string"
                                                          },
                                                          "password": {
                                                                    "type": "string"
                                                          },
                                                          "phone": {
                                                                    "type": "string"
                                                          },
                                                          "userStatus": {
                                                                    "type": "integer",
                                                                    "format": "int32",
                                                                    "description": "User Status"
                                                          }
                                                },
                                                "xml": {
                                                          "name": "User"
                                                }
                                      },
                                      "description": "List of user object"
                            }
                  },
                  "required": [
                            "body"
                  ]
        },
        ),
        Tool(
            name="getUserByName",
            description="Get user by user name",
            inputSchema={
                  "type": "object",
                  "properties": {
                            "username": {
                                      "type": "string",
                                      "description": "The name that needs to be fetched. Use user1 for testing. "
                            }
                  },
                  "required": [
                            "username"
                  ]
        },
        ),
        Tool(
            name="updateUser",
            description="Updated user",
            inputSchema={
                  "type": "object",
                  "properties": {
                            "username": {
                                      "type": "string",
                                      "description": "name that need to be updated"
                            },
                            "body": {
                                      "type": "object",
                                      "description": "Updated user object",
                                      "properties": {
                                                "id": {
                                                          "type": "integer",
                                                          "format": "int64"
                                                },
                                                "username": {
                                                          "type": "string"
                                                },
                                                "firstName": {
                                                          "type": "string"
                                                },
                                                "lastName": {
                                                          "type": "string"
                                                },
                                                "email": {
                                                          "type": "string"
                                                },
                                                "password": {
                                                          "type": "string"
                                                },
                                                "phone": {
                                                          "type": "string"
                                                },
                                                "userStatus": {
                                                          "type": "integer",
                                                          "format": "int32",
                                                          "description": "User Status"
                                                }
                                      },
                                      "required": []
                            }
                  },
                  "required": [
                            "username",
                            "body"
                  ]
        },
        ),
        Tool(
            name="deleteUser",
            description="Delete user",
            inputSchema={
                  "type": "object",
                  "properties": {
                            "username": {
                                      "type": "string",
                                      "description": "The name that needs to be deleted"
                            }
                  },
                  "required": [
                            "username"
                  ]
        },
        ),
        Tool(
            name="loginUser",
            description="Logs user into the system",
            inputSchema={
                  "type": "object",
                  "properties": {
                            "username": {
                                      "type": "string",
                                      "description": "The user name for login"
                            },
                            "password": {
                                      "type": "string",
                                      "description": "The password for login in clear text"
                            }
                  },
                  "required": [
                            "username",
                            "password"
                  ]
        },
        ),
        Tool(
            name="logoutUser",
            description="Logs out current logged in user session",
            inputSchema={
                  "type": "object",
                  "properties": {},
                  "required": []
        },
        ),
        Tool(
            name="createUsersWithArrayInput",
            description="Creates list of users with given input array",
            inputSchema={
                  "type": "object",
                  "properties": {
                            "body": {
                                      "type": "array",
                                      "items": {
                                                "type": "object",
                                                "properties": {
                                                          "id": {
                                                                    "type": "integer",
                                                                    "format": "int64"
                                                          },
                                                          "username": {
                                                                    "type": "string"
                                                          },
                                                          "firstName": {
                                                                    "type": "string"
                                                          },
                                                          "lastName": {
                                                                    "type": "string"
                                                          },
                                                          "email": {
                                                                    "type": "string"
                                                          },
                                                          "password": {
                                                                    "type": "string"
                                                          },
                                                          "phone": {
                                                                    "type": "string"
                                                          },
                                                          "userStatus": {
                                                                    "type": "integer",
                                                                    "format": "int32",
                                                                    "description": "User Status"
                                                          }
                                                },
                                                "xml": {
                                                          "name": "User"
                                                }
                                      },
                                      "description": "List of user object"
                            }
                  },
                  "required": [
                            "body"
                  ]
        },
        ),
        Tool(
            name="createUser",
            description="Create user",
            inputSchema={
                  "type": "object",
                  "properties": {
                            "body": {
                                      "type": "object",
                                      "description": "Created user object",
                                      "properties": {
                                                "id": {
                                                          "type": "integer",
                                                          "format": "int64"
                                                },
                                                "username": {
                                                          "type": "string"
                                                },
                                                "firstName": {
                                                          "type": "string"
                                                },
                                                "lastName": {
                                                          "type": "string"
                                                },
                                                "email": {
                                                          "type": "string"
                                                },
                                                "password": {
                                                          "type": "string"
                                                },
                                                "phone": {
                                                          "type": "string"
                                                },
                                                "userStatus": {
                                                          "type": "integer",
                                                          "format": "int32",
                                                          "description": "User Status"
                                                }
                                      },
                                      "required": []
                            }
                  },
                  "required": [
                            "body"
                  ]
        },
        )
    ]


@server.call_tool()
async def call_tool(name: str, arguments: dict[str, Any]) -> list[TextContent]:
    """Execute a tool by name."""
        if name == "uploadFile":
        result = await uploadFile(arguments)
        return [TextContent(type="text", text=json.dumps(result, indent=2))]
    el    if name == "addPet":
        result = await addPet(arguments)
        return [TextContent(type="text", text=json.dumps(result, indent=2))]
    el    if name == "updatePet":
        result = await updatePet(arguments)
        return [TextContent(type="text", text=json.dumps(result, indent=2))]
    el    if name == "findPetsByStatus":
        result = await findPetsByStatus(arguments)
        return [TextContent(type="text", text=json.dumps(result, indent=2))]
    el    if name == "findPetsByTags":
        result = await findPetsByTags(arguments)
        return [TextContent(type="text", text=json.dumps(result, indent=2))]
    el    if name == "getPetById":
        result = await getPetById(arguments)
        return [TextContent(type="text", text=json.dumps(result, indent=2))]
    el    if name == "updatePetWithForm":
        result = await updatePetWithForm(arguments)
        return [TextContent(type="text", text=json.dumps(result, indent=2))]
    el    if name == "deletePet":
        result = await deletePet(arguments)
        return [TextContent(type="text", text=json.dumps(result, indent=2))]
    el    if name == "getInventory":
        result = await getInventory(arguments)
        return [TextContent(type="text", text=json.dumps(result, indent=2))]
    el    if name == "placeOrder":
        result = await placeOrder(arguments)
        return [TextContent(type="text", text=json.dumps(result, indent=2))]
    el    if name == "getOrderById":
        result = await getOrderById(arguments)
        return [TextContent(type="text", text=json.dumps(result, indent=2))]
    el    if name == "deleteOrder":
        result = await deleteOrder(arguments)
        return [TextContent(type="text", text=json.dumps(result, indent=2))]
    el    if name == "createUsersWithListInput":
        result = await createUsersWithListInput(arguments)
        return [TextContent(type="text", text=json.dumps(result, indent=2))]
    el    if name == "getUserByName":
        result = await getUserByName(arguments)
        return [TextContent(type="text", text=json.dumps(result, indent=2))]
    el    if name == "updateUser":
        result = await updateUser(arguments)
        return [TextContent(type="text", text=json.dumps(result, indent=2))]
    el    if name == "deleteUser":
        result = await deleteUser(arguments)
        return [TextContent(type="text", text=json.dumps(result, indent=2))]
    el    if name == "loginUser":
        result = await loginUser(arguments)
        return [TextContent(type="text", text=json.dumps(result, indent=2))]
    el    if name == "logoutUser":
        result = await logoutUser(arguments)
        return [TextContent(type="text", text=json.dumps(result, indent=2))]
    el    if name == "createUsersWithArrayInput":
        result = await createUsersWithArrayInput(arguments)
        return [TextContent(type="text", text=json.dumps(result, indent=2))]
    el    if name == "createUser":
        result = await createUser(arguments)
        return [TextContent(type="text", text=json.dumps(result, indent=2))]
    else:
        raise ValueError(f"Unknown tool: {name}")


async def uploadFile(arguments: dict[str, Any]) -> dict:
    """uploads an image"""
    petId = arguments.get("petId", "")
    url = f"/pet/{petId}/uploadImage"
    response = client.post(url)
    response.raise_for_status()
    return response.json()

async def addPet(arguments: dict[str, Any]) -> dict:
    """Add a new pet to the store"""
    data = arguments.get("body")
    url = "/pet"
    response = client.post(url, json=data)
    response.raise_for_status()
    return response.json()

async def updatePet(arguments: dict[str, Any]) -> dict:
    """Update an existing pet"""
    data = arguments.get("body")
    url = "/pet"
    response = client.put(url, json=data)
    response.raise_for_status()
    return response.json()

async def findPetsByStatus(arguments: dict[str, Any]) -> dict:
    """Finds Pets by status"""
    params = {"status": arguments.get("status")}
    url = "/pet/findByStatus"
    response = client.get(url, params=params)
    response.raise_for_status()
    return response.json()

async def findPetsByTags(arguments: dict[str, Any]) -> dict:
    """Finds Pets by tags"""
    params = {"tags": arguments.get("tags")}
    url = "/pet/findByTags"
    response = client.get(url, params=params)
    response.raise_for_status()
    return response.json()

async def getPetById(arguments: dict[str, Any]) -> dict:
    """Find pet by ID"""
    petId = arguments.get("petId", "")
    url = f"/pet/{petId}"
    response = client.get(url)
    response.raise_for_status()
    return response.json()

async def updatePetWithForm(arguments: dict[str, Any]) -> dict:
    """Updates a pet in the store with form data"""
    petId = arguments.get("petId", "")
    url = f"/pet/{petId}"
    response = client.post(url)
    response.raise_for_status()
    return response.json()

async def deletePet(arguments: dict[str, Any]) -> dict:
    """Deletes a pet"""
    petId = arguments.get("petId", "")
    url = f"/pet/{petId}"
    response = client.delete(url)
    response.raise_for_status()
    return response.json()

async def getInventory(arguments: dict[str, Any]) -> dict:
    """Returns pet inventories by status"""
    url = "/store/inventory"
    response = client.get(url)
    response.raise_for_status()
    return response.json()

async def placeOrder(arguments: dict[str, Any]) -> dict:
    """Place an order for a pet"""
    data = arguments.get("body")
    url = "/store/order"
    response = client.post(url, json=data)
    response.raise_for_status()
    return response.json()

async def getOrderById(arguments: dict[str, Any]) -> dict:
    """Find purchase order by ID"""
    orderId = arguments.get("orderId", "")
    url = f"/store/order/{orderId}"
    response = client.get(url)
    response.raise_for_status()
    return response.json()

async def deleteOrder(arguments: dict[str, Any]) -> dict:
    """Delete purchase order by ID"""
    orderId = arguments.get("orderId", "")
    url = f"/store/order/{orderId}"
    response = client.delete(url)
    response.raise_for_status()
    return response.json()

async def createUsersWithListInput(arguments: dict[str, Any]) -> dict:
    """Creates list of users with given input array"""
    data = arguments.get("body")
    url = "/user/createWithList"
    response = client.post(url, json=data)
    response.raise_for_status()
    return response.json()

async def getUserByName(arguments: dict[str, Any]) -> dict:
    """Get user by user name"""
    username = arguments.get("username", "")
    url = f"/user/{username}"
    response = client.get(url)
    response.raise_for_status()
    return response.json()

async def updateUser(arguments: dict[str, Any]) -> dict:
    """Updated user"""
    username = arguments.get("username", "")
    data = arguments.get("body")
    url = f"/user/{username}"
    response = client.put(url, json=data)
    response.raise_for_status()
    return response.json()

async def deleteUser(arguments: dict[str, Any]) -> dict:
    """Delete user"""
    username = arguments.get("username", "")
    url = f"/user/{username}"
    response = client.delete(url)
    response.raise_for_status()
    return response.json()

async def loginUser(arguments: dict[str, Any]) -> dict:
    """Logs user into the system"""
    params = {"username": arguments.get("username"), "password": arguments.get("password")}
    url = "/user/login"
    response = client.get(url, params=params)
    response.raise_for_status()
    return response.json()

async def logoutUser(arguments: dict[str, Any]) -> dict:
    """Logs out current logged in user session"""
    url = "/user/logout"
    response = client.get(url)
    response.raise_for_status()
    return response.json()

async def createUsersWithArrayInput(arguments: dict[str, Any]) -> dict:
    """Creates list of users with given input array"""
    data = arguments.get("body")
    url = "/user/createWithArray"
    response = client.post(url, json=data)
    response.raise_for_status()
    return response.json()

async def createUser(arguments: dict[str, Any]) -> dict:
    """Create user"""
    data = arguments.get("body")
    url = "/user"
    response = client.post(url, json=data)
    response.raise_for_status()
    return response.json()


async def main():
    """Main entry point for the MCP server."""
    async with stdio_server() as (read_stream, write_stream):
        await server.run(
            read_stream,
            write_stream,
            server.create_initialization_options(),
        )


if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
