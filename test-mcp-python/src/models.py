"""
Pydantic models generated from OpenAPI specification.

Uses Pydantic v2 for runtime validation as per MCP SDK best practices.
"""

from pydantic import BaseModel, Field
from typing import Any


class ApiResponse(BaseModel):
    """ApiResponse model."""
    code: int | None = None
    type: str | None = None
    message: str | None = None

class Category(BaseModel):
    """Category model."""
    id: int | None = None
    name: str | None = None

class Pet(BaseModel):
    """Pet model."""
    id: int | None = None
    category: Category | None = None
    name: str
    photoUrls: list[str]
    tags: list[Tag] | None = None
    status: str | None = Field(description="pet status in the store")

class Tag(BaseModel):
    """Tag model."""
    id: int | None = None
    name: str | None = None

class Order(BaseModel):
    """Order model."""
    id: int | None = None
    petId: int | None = None
    quantity: int | None = None
    shipDate: str | None = None
    status: str | None = Field(description="Order Status")
    complete: bool | None = None

class User(BaseModel):
    """User model."""
    id: int | None = None
    username: str | None = None
    firstName: str | None = None
    lastName: str | None = None
    email: str | None = None
    password: str | None = None
    phone: str | None = None
    userStatus: int | None = Field(description="User Status")

# Tool Input Models
class UploadFileInput(BaseModel):
    """Input model for uploadFile."""
    petId: str = Field(description="ID of pet to update")

class AddPetInput(BaseModel):
    """Input model for addPet."""
    body: dict[str, Any] = Field(description="Pet object that needs to be added to the store")

class UpdatePetInput(BaseModel):
    """Input model for updatePet."""
    body: dict[str, Any] = Field(description="Pet object that needs to be added to the store")

class FindPetsByStatusInput(BaseModel):
    """Input model for findPetsByStatus."""
    status: str = Field(description="Status values that need to be considered for filter")

class FindPetsByTagsInput(BaseModel):
    """Input model for findPetsByTags."""
    tags: str = Field(description="Tags to filter by")

class GetPetByIdInput(BaseModel):
    """Input model for getPetById."""
    petId: str = Field(description="ID of pet to return")

class UpdatePetWithFormInput(BaseModel):
    """Input model for updatePetWithForm."""
    petId: str = Field(description="ID of pet that needs to be updated")

class DeletePetInput(BaseModel):
    """Input model for deletePet."""
    petId: str = Field(description="Pet id to delete")

class GetInventoryInput(BaseModel):
    """Input model for getInventory."""
    pass

class PlaceOrderInput(BaseModel):
    """Input model for placeOrder."""
    body: dict[str, Any] = Field(description="order placed for purchasing the pet")

class GetOrderByIdInput(BaseModel):
    """Input model for getOrderById."""
    orderId: str = Field(description="ID of pet that needs to be fetched")

class DeleteOrderInput(BaseModel):
    """Input model for deleteOrder."""
    orderId: str = Field(description="ID of the order that needs to be deleted")

class CreateUsersWithListInputInput(BaseModel):
    """Input model for createUsersWithListInput."""
    body: list[dict[str, Any]] = Field(description="List of user object")

class GetUserByNameInput(BaseModel):
    """Input model for getUserByName."""
    username: str = Field(description="The name that needs to be fetched. Use user1 for testing. ")

class UpdateUserInput(BaseModel):
    """Input model for updateUser."""
    username: str = Field(description="name that need to be updated")
    body: dict[str, Any] = Field(description="Updated user object")

class DeleteUserInput(BaseModel):
    """Input model for deleteUser."""
    username: str = Field(description="The name that needs to be deleted")

class LoginUserInput(BaseModel):
    """Input model for loginUser."""
    username: str = Field(description="The user name for login")
    password: str = Field(description="The password for login in clear text")

class LogoutUserInput(BaseModel):
    """Input model for logoutUser."""
    pass

class CreateUsersWithArrayInputInput(BaseModel):
    """Input model for createUsersWithArrayInput."""
    body: list[dict[str, Any]] = Field(description="List of user object")

class CreateUserInput(BaseModel):
    """Input model for createUser."""
    body: dict[str, Any] = Field(description="Created user object")
