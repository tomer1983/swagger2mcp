# Swagger Petstore

This is a sample server Petstore server.  You can find out more about Swagger at [http://swagger.io](http://swagger.io) or on [irc.freenode.net, #swagger](http://swagger.io/irc/).  For this sample, you can use the api key `special-key` to test the authorization filters.

## Installation

```bash
npm install && npm run build
```

## Configuration

Set environment variables:
- `API_BASE_URL`: Override the default API base URL (default: https://petstore.swagger.io/v2)
- `API_KEY`: API key for authentication

## Usage

### With Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "swagger-petstore": {
      "command": "node",
      "args": ["path/to/swagger-petstore/dist/index.js"],
      "env": {
        "API_KEY": "your-api-key"
      }
    }
  }
}
```

### Standalone

```bash
node dist/index.js
```

## Available Tools

### uploadFile
uploads an image
- **Method**: POST
- **Path**: /pet/{petId}/uploadImage

### addPet
Add a new pet to the store
- **Method**: POST
- **Path**: /pet

### updatePet
Update an existing pet
- **Method**: PUT
- **Path**: /pet

### findPetsByStatus
Finds Pets by status
- **Method**: GET
- **Path**: /pet/findByStatus

### findPetsByTags
Finds Pets by tags
- **Method**: GET
- **Path**: /pet/findByTags

### getPetById
Find pet by ID
- **Method**: GET
- **Path**: /pet/{petId}

### updatePetWithForm
Updates a pet in the store with form data
- **Method**: POST
- **Path**: /pet/{petId}

### deletePet
Deletes a pet
- **Method**: DELETE
- **Path**: /pet/{petId}

### getInventory
Returns pet inventories by status
- **Method**: GET
- **Path**: /store/inventory

### placeOrder
Place an order for a pet
- **Method**: POST
- **Path**: /store/order

### getOrderById
Find purchase order by ID
- **Method**: GET
- **Path**: /store/order/{orderId}

### deleteOrder
Delete purchase order by ID
- **Method**: DELETE
- **Path**: /store/order/{orderId}

### createUsersWithListInput
Creates list of users with given input array
- **Method**: POST
- **Path**: /user/createWithList

### getUserByName
Get user by user name
- **Method**: GET
- **Path**: /user/{username}

### updateUser
Updated user
- **Method**: PUT
- **Path**: /user/{username}

### deleteUser
Delete user
- **Method**: DELETE
- **Path**: /user/{username}

### loginUser
Logs user into the system
- **Method**: GET
- **Path**: /user/login

### logoutUser
Logs out current logged in user session
- **Method**: GET
- **Path**: /user/logout

### createUsersWithArrayInput
Creates list of users with given input array
- **Method**: POST
- **Path**: /user/createWithArray

### createUser
Create user
- **Method**: POST
- **Path**: /user

