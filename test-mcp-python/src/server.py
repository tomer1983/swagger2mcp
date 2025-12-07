"""
Swagger Petstore
MCP Server generated from OpenAPI specification.

Uses the high-level FastMCP API with Pydantic validation
as per official MCP SDK best practices.

@see https://github.com/modelcontextprotocol/python-sdk
"""

import argparse
from typing import Any
from mcp.server.fastmcp import FastMCP

# Create FastMCP server instance (high-level API)
mcp = FastMCP(
    name="Swagger Petstore",
    instructions="This is a sample server Petstore server.  You can find out more about Swagger at [http://swagger.io](http://swagger.io) or on [irc.freenode.net, #swagger](http://swagger.io/irc/).  For this sample, yo",
)


# Tool registrations using @mcp.tool() decorator
@mcp.tool()
async def uploadFile(petId: str) -> dict[str, Any]:
    """uploads an image
    
    POST /pet/{petId}/uploadImage
    """
    from .tools import uploadFile as impl
    from .models import UploadFileInput
    args = UploadFileInput(petId=petId)
    return await impl(args)


@mcp.tool()
async def addPet(body: dict[str, Any]) -> dict[str, Any]:
    """Add a new pet to the store
    
    POST /pet
    """
    from .tools import addPet as impl
    from .models import AddPetInput
    args = AddPetInput(body=body)
    return await impl(args)


@mcp.tool()
async def updatePet(body: dict[str, Any]) -> dict[str, Any]:
    """Update an existing pet
    
    PUT /pet
    """
    from .tools import updatePet as impl
    from .models import UpdatePetInput
    args = UpdatePetInput(body=body)
    return await impl(args)


@mcp.tool()
async def findPetsByStatus(status: str) -> dict[str, Any]:
    """Finds Pets by status
    
    GET /pet/findByStatus
    """
    from .tools import findPetsByStatus as impl
    from .models import FindPetsByStatusInput
    args = FindPetsByStatusInput(status=status)
    return await impl(args)


@mcp.tool()
async def findPetsByTags(tags: str) -> dict[str, Any]:
    """Finds Pets by tags
    
    GET /pet/findByTags
    """
    from .tools import findPetsByTags as impl
    from .models import FindPetsByTagsInput
    args = FindPetsByTagsInput(tags=tags)
    return await impl(args)


@mcp.tool()
async def getPetById(petId: str) -> dict[str, Any]:
    """Find pet by ID
    
    GET /pet/{petId}
    """
    from .tools import getPetById as impl
    from .models import GetPetByIdInput
    args = GetPetByIdInput(petId=petId)
    return await impl(args)


@mcp.tool()
async def updatePetWithForm(petId: str) -> dict[str, Any]:
    """Updates a pet in the store with form data
    
    POST /pet/{petId}
    """
    from .tools import updatePetWithForm as impl
    from .models import UpdatePetWithFormInput
    args = UpdatePetWithFormInput(petId=petId)
    return await impl(args)


@mcp.tool()
async def deletePet(petId: str) -> dict[str, Any]:
    """Deletes a pet
    
    DELETE /pet/{petId}
    """
    from .tools import deletePet as impl
    from .models import DeletePetInput
    args = DeletePetInput(petId=petId)
    return await impl(args)


@mcp.tool()
async def getInventory() -> dict[str, Any]:
    """Returns pet inventories by status
    
    GET /store/inventory
    """
    from .tools import getInventory as impl
    from .models import GetInventoryInput
    args = GetInventoryInput()
    return await impl(args)


@mcp.tool()
async def placeOrder(body: dict[str, Any]) -> dict[str, Any]:
    """Place an order for a pet
    
    POST /store/order
    """
    from .tools import placeOrder as impl
    from .models import PlaceOrderInput
    args = PlaceOrderInput(body=body)
    return await impl(args)


@mcp.tool()
async def getOrderById(orderId: str) -> dict[str, Any]:
    """Find purchase order by ID
    
    GET /store/order/{orderId}
    """
    from .tools import getOrderById as impl
    from .models import GetOrderByIdInput
    args = GetOrderByIdInput(orderId=orderId)
    return await impl(args)


@mcp.tool()
async def deleteOrder(orderId: str) -> dict[str, Any]:
    """Delete purchase order by ID
    
    DELETE /store/order/{orderId}
    """
    from .tools import deleteOrder as impl
    from .models import DeleteOrderInput
    args = DeleteOrderInput(orderId=orderId)
    return await impl(args)


@mcp.tool()
async def createUsersWithListInput(body: list[dict[str, Any]]) -> dict[str, Any]:
    """Creates list of users with given input array
    
    POST /user/createWithList
    """
    from .tools import createUsersWithListInput as impl
    from .models import CreateUsersWithListInputInput
    args = CreateUsersWithListInputInput(body=body)
    return await impl(args)


@mcp.tool()
async def getUserByName(username: str) -> dict[str, Any]:
    """Get user by user name
    
    GET /user/{username}
    """
    from .tools import getUserByName as impl
    from .models import GetUserByNameInput
    args = GetUserByNameInput(username=username)
    return await impl(args)


@mcp.tool()
async def updateUser(username: str, body: dict[str, Any]) -> dict[str, Any]:
    """Updated user
    
    PUT /user/{username}
    """
    from .tools import updateUser as impl
    from .models import UpdateUserInput
    args = UpdateUserInput(username=username, body=body)
    return await impl(args)


@mcp.tool()
async def deleteUser(username: str) -> dict[str, Any]:
    """Delete user
    
    DELETE /user/{username}
    """
    from .tools import deleteUser as impl
    from .models import DeleteUserInput
    args = DeleteUserInput(username=username)
    return await impl(args)


@mcp.tool()
async def loginUser(username: str, password: str) -> dict[str, Any]:
    """Logs user into the system
    
    GET /user/login
    """
    from .tools import loginUser as impl
    from .models import LoginUserInput
    args = LoginUserInput(username=username, password=password)
    return await impl(args)


@mcp.tool()
async def logoutUser() -> dict[str, Any]:
    """Logs out current logged in user session
    
    GET /user/logout
    """
    from .tools import logoutUser as impl
    from .models import LogoutUserInput
    args = LogoutUserInput()
    return await impl(args)


@mcp.tool()
async def createUsersWithArrayInput(body: list[dict[str, Any]]) -> dict[str, Any]:
    """Creates list of users with given input array
    
    POST /user/createWithArray
    """
    from .tools import createUsersWithArrayInput as impl
    from .models import CreateUsersWithArrayInputInput
    args = CreateUsersWithArrayInputInput(body=body)
    return await impl(args)


@mcp.tool()
async def createUser(body: dict[str, Any]) -> dict[str, Any]:
    """Create user
    
    POST /user
    """
    from .tools import createUser as impl
    from .models import CreateUserInput
    args = CreateUserInput(body=body)
    return await impl(args)


def main():
    """Main entry point for the MCP server."""
    parser = argparse.ArgumentParser(description="Swagger Petstore")
    parser.add_argument("--http", action="store_true", help="Use HTTP transport")
    parser.add_argument("--port", type=int, default=8000, help="HTTP port (default: 8000)")
    args = parser.parse_args()
    
    if args.http:
        # Run with Streamable HTTP transport for remote deployment
        mcp.run(transport="streamable-http", host="0.0.0.0", port=args.port)
    else:
        # Run with stdio transport (default for Claude Desktop)
        mcp.run()


if __name__ == "__main__":
    main()
