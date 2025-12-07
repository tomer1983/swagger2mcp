
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import axios from "axios";

const server = new Server(
  {
    name: "swagger-petstore",
    version: "1.0.7",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

const BASE_URL = process.env.API_BASE_URL || "https://petstore.swagger.io/v2";

const API_KEY = process.env.API_KEY || "";

function getAuthHeaders(): Record<string, string> {
  return API_KEY ? { Authorization: `Bearer ${API_KEY}` } : {};
}

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "uploadFile",
        description: "uploads an image",
        inputSchema: {
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
      },
      {
        name: "addPet",
        description: "Add a new pet to the store",
        inputSchema: {
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
      },
      {
        name: "updatePet",
        description: "Update an existing pet",
        inputSchema: {
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
      },
      {
        name: "findPetsByStatus",
        description: "Finds Pets by status",
        inputSchema: {
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
      },
      {
        name: "findPetsByTags",
        description: "Finds Pets by tags",
        inputSchema: {
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
      },
      {
        name: "getPetById",
        description: "Find pet by ID",
        inputSchema: {
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
      },
      {
        name: "updatePetWithForm",
        description: "Updates a pet in the store with form data",
        inputSchema: {
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
      },
      {
        name: "deletePet",
        description: "Deletes a pet",
        inputSchema: {
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
      },
      {
        name: "getInventory",
        description: "Returns pet inventories by status",
        inputSchema: {
            "type": "object",
            "properties": {},
            "required": []
      },
      },
      {
        name: "placeOrder",
        description: "Place an order for a pet",
        inputSchema: {
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
      },
      {
        name: "getOrderById",
        description: "Find purchase order by ID",
        inputSchema: {
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
      },
      {
        name: "deleteOrder",
        description: "Delete purchase order by ID",
        inputSchema: {
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
      },
      {
        name: "createUsersWithListInput",
        description: "Creates list of users with given input array",
        inputSchema: {
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
      },
      {
        name: "getUserByName",
        description: "Get user by user name",
        inputSchema: {
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
      },
      {
        name: "updateUser",
        description: "Updated user",
        inputSchema: {
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
      },
      {
        name: "deleteUser",
        description: "Delete user",
        inputSchema: {
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
      },
      {
        name: "loginUser",
        description: "Logs user into the system",
        inputSchema: {
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
      },
      {
        name: "logoutUser",
        description: "Logs out current logged in user session",
        inputSchema: {
            "type": "object",
            "properties": {},
            "required": []
      },
      },
      {
        name: "createUsersWithArrayInput",
        description: "Creates list of users with given input array",
        inputSchema: {
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
      },
      {
        name: "createUser",
        description: "Create user",
        inputSchema: {
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
      }
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    
    case "uploadFile": {
      const response = await axios({
        method: "POST",
        url: `${BASE_URL}/pet/${args?.petId ?? ''}/uploadImage`,
        
        
        headers: getAuthHeaders(),
      });
      return {
        content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }],
      };
    }
    
    case "addPet": {
      const response = await axios({
        method: "POST",
        url: `${BASE_URL}/pet`,
        
        data: args?.body,
        headers: getAuthHeaders(),
      });
      return {
        content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }],
      };
    }
    
    case "updatePet": {
      const response = await axios({
        method: "PUT",
        url: `${BASE_URL}/pet`,
        
        data: args?.body,
        headers: getAuthHeaders(),
      });
      return {
        content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }],
      };
    }
    
    case "findPetsByStatus": {
      const response = await axios({
        method: "GET",
        url: `${BASE_URL}/pet/findByStatus`,
        params: { status: args?.status },
        
        headers: getAuthHeaders(),
      });
      return {
        content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }],
      };
    }
    
    case "findPetsByTags": {
      const response = await axios({
        method: "GET",
        url: `${BASE_URL}/pet/findByTags`,
        params: { tags: args?.tags },
        
        headers: getAuthHeaders(),
      });
      return {
        content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }],
      };
    }
    
    case "getPetById": {
      const response = await axios({
        method: "GET",
        url: `${BASE_URL}/pet/${args?.petId ?? ''}`,
        
        
        headers: getAuthHeaders(),
      });
      return {
        content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }],
      };
    }
    
    case "updatePetWithForm": {
      const response = await axios({
        method: "POST",
        url: `${BASE_URL}/pet/${args?.petId ?? ''}`,
        
        
        headers: getAuthHeaders(),
      });
      return {
        content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }],
      };
    }
    
    case "deletePet": {
      const response = await axios({
        method: "DELETE",
        url: `${BASE_URL}/pet/${args?.petId ?? ''}`,
        
        
        headers: getAuthHeaders(),
      });
      return {
        content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }],
      };
    }
    
    case "getInventory": {
      const response = await axios({
        method: "GET",
        url: `${BASE_URL}/store/inventory`,
        
        
        headers: getAuthHeaders(),
      });
      return {
        content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }],
      };
    }
    
    case "placeOrder": {
      const response = await axios({
        method: "POST",
        url: `${BASE_URL}/store/order`,
        
        data: args?.body,
        headers: getAuthHeaders(),
      });
      return {
        content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }],
      };
    }
    
    case "getOrderById": {
      const response = await axios({
        method: "GET",
        url: `${BASE_URL}/store/order/${args?.orderId ?? ''}`,
        
        
        headers: getAuthHeaders(),
      });
      return {
        content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }],
      };
    }
    
    case "deleteOrder": {
      const response = await axios({
        method: "DELETE",
        url: `${BASE_URL}/store/order/${args?.orderId ?? ''}`,
        
        
        headers: getAuthHeaders(),
      });
      return {
        content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }],
      };
    }
    
    case "createUsersWithListInput": {
      const response = await axios({
        method: "POST",
        url: `${BASE_URL}/user/createWithList`,
        
        data: args?.body,
        headers: getAuthHeaders(),
      });
      return {
        content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }],
      };
    }
    
    case "getUserByName": {
      const response = await axios({
        method: "GET",
        url: `${BASE_URL}/user/${args?.username ?? ''}`,
        
        
        headers: getAuthHeaders(),
      });
      return {
        content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }],
      };
    }
    
    case "updateUser": {
      const response = await axios({
        method: "PUT",
        url: `${BASE_URL}/user/${args?.username ?? ''}`,
        
        data: args?.body,
        headers: getAuthHeaders(),
      });
      return {
        content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }],
      };
    }
    
    case "deleteUser": {
      const response = await axios({
        method: "DELETE",
        url: `${BASE_URL}/user/${args?.username ?? ''}`,
        
        
        headers: getAuthHeaders(),
      });
      return {
        content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }],
      };
    }
    
    case "loginUser": {
      const response = await axios({
        method: "GET",
        url: `${BASE_URL}/user/login`,
        params: { username: args?.username, password: args?.password },
        
        headers: getAuthHeaders(),
      });
      return {
        content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }],
      };
    }
    
    case "logoutUser": {
      const response = await axios({
        method: "GET",
        url: `${BASE_URL}/user/logout`,
        
        
        headers: getAuthHeaders(),
      });
      return {
        content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }],
      };
    }
    
    case "createUsersWithArrayInput": {
      const response = await axios({
        method: "POST",
        url: `${BASE_URL}/user/createWithArray`,
        
        data: args?.body,
        headers: getAuthHeaders(),
      });
      return {
        content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }],
      };
    }
    
    case "createUser": {
      const response = await axios({
        method: "POST",
        url: `${BASE_URL}/user`,
        
        data: args?.body,
        headers: getAuthHeaders(),
      });
      return {
        content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }],
      };
    }
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
