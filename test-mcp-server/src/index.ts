/**
 * swagger-petstore
 * MCP Server generated from OpenAPI specification
 * 
 * Uses the high-level McpServer API with Zod schema validation
 * as per official MCP SDK best practices.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

// Import Zod schemas for input validation
import { uploadFileSchema, addPetSchema, updatePetSchema, findPetsByStatusSchema, findPetsByTagsSchema, getPetByIdSchema, updatePetWithFormSchema, deletePetSchema, getInventorySchema, placeOrderSchema, getOrderByIdSchema, deleteOrderSchema, createUsersWithListInputSchema, getUserByNameSchema, updateUserSchema, deleteUserSchema, loginUserSchema, logoutUserSchema, createUsersWithArrayInputSchema, createUserSchema } from "./schemas.js";

// Import tool implementations
import { uploadFile, addPet, updatePet, findPetsByStatus, findPetsByTags, getPetById, updatePetWithForm, deletePet, getInventory, placeOrder, getOrderById, deleteOrder, createUsersWithListInput, getUserByName, updateUser, deleteUser, loginUser, logoutUser, createUsersWithArrayInput, createUser } from "./tools.js";

// Create McpServer instance using high-level API
const server = new McpServer({
  name: "swagger-petstore",
  version: "1.0.7",
});


// Register: uploadFile
server.tool(
  "uploadFile",
  "uploads an image",
  uploadFileSchema.shape,
  async (args) => {
    try {
      const result = await uploadFile(args);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        content: [{ type: "text", text: `Error: ${message}` }],
        isError: true,
      };
    }
  }
);

// Register: addPet
server.tool(
  "addPet",
  "Add a new pet to the store",
  addPetSchema.shape,
  async (args) => {
    try {
      const result = await addPet(args);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        content: [{ type: "text", text: `Error: ${message}` }],
        isError: true,
      };
    }
  }
);

// Register: updatePet
server.tool(
  "updatePet",
  "Update an existing pet",
  updatePetSchema.shape,
  async (args) => {
    try {
      const result = await updatePet(args);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        content: [{ type: "text", text: `Error: ${message}` }],
        isError: true,
      };
    }
  }
);

// Register: findPetsByStatus
server.tool(
  "findPetsByStatus",
  "Finds Pets by status",
  findPetsByStatusSchema.shape,
  async (args) => {
    try {
      const result = await findPetsByStatus(args);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        content: [{ type: "text", text: `Error: ${message}` }],
        isError: true,
      };
    }
  }
);

// Register: findPetsByTags
server.tool(
  "findPetsByTags",
  "Finds Pets by tags",
  findPetsByTagsSchema.shape,
  async (args) => {
    try {
      const result = await findPetsByTags(args);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        content: [{ type: "text", text: `Error: ${message}` }],
        isError: true,
      };
    }
  }
);

// Register: getPetById
server.tool(
  "getPetById",
  "Find pet by ID",
  getPetByIdSchema.shape,
  async (args) => {
    try {
      const result = await getPetById(args);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        content: [{ type: "text", text: `Error: ${message}` }],
        isError: true,
      };
    }
  }
);

// Register: updatePetWithForm
server.tool(
  "updatePetWithForm",
  "Updates a pet in the store with form data",
  updatePetWithFormSchema.shape,
  async (args) => {
    try {
      const result = await updatePetWithForm(args);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        content: [{ type: "text", text: `Error: ${message}` }],
        isError: true,
      };
    }
  }
);

// Register: deletePet
server.tool(
  "deletePet",
  "Deletes a pet",
  deletePetSchema.shape,
  async (args) => {
    try {
      const result = await deletePet(args);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        content: [{ type: "text", text: `Error: ${message}` }],
        isError: true,
      };
    }
  }
);

// Register: getInventory
server.tool(
  "getInventory",
  "Returns pet inventories by status",
  getInventorySchema.shape,
  async (args) => {
    try {
      const result = await getInventory(args);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        content: [{ type: "text", text: `Error: ${message}` }],
        isError: true,
      };
    }
  }
);

// Register: placeOrder
server.tool(
  "placeOrder",
  "Place an order for a pet",
  placeOrderSchema.shape,
  async (args) => {
    try {
      const result = await placeOrder(args);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        content: [{ type: "text", text: `Error: ${message}` }],
        isError: true,
      };
    }
  }
);

// Register: getOrderById
server.tool(
  "getOrderById",
  "Find purchase order by ID",
  getOrderByIdSchema.shape,
  async (args) => {
    try {
      const result = await getOrderById(args);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        content: [{ type: "text", text: `Error: ${message}` }],
        isError: true,
      };
    }
  }
);

// Register: deleteOrder
server.tool(
  "deleteOrder",
  "Delete purchase order by ID",
  deleteOrderSchema.shape,
  async (args) => {
    try {
      const result = await deleteOrder(args);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        content: [{ type: "text", text: `Error: ${message}` }],
        isError: true,
      };
    }
  }
);

// Register: createUsersWithListInput
server.tool(
  "createUsersWithListInput",
  "Creates list of users with given input array",
  createUsersWithListInputSchema.shape,
  async (args) => {
    try {
      const result = await createUsersWithListInput(args);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        content: [{ type: "text", text: `Error: ${message}` }],
        isError: true,
      };
    }
  }
);

// Register: getUserByName
server.tool(
  "getUserByName",
  "Get user by user name",
  getUserByNameSchema.shape,
  async (args) => {
    try {
      const result = await getUserByName(args);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        content: [{ type: "text", text: `Error: ${message}` }],
        isError: true,
      };
    }
  }
);

// Register: updateUser
server.tool(
  "updateUser",
  "Updated user",
  updateUserSchema.shape,
  async (args) => {
    try {
      const result = await updateUser(args);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        content: [{ type: "text", text: `Error: ${message}` }],
        isError: true,
      };
    }
  }
);

// Register: deleteUser
server.tool(
  "deleteUser",
  "Delete user",
  deleteUserSchema.shape,
  async (args) => {
    try {
      const result = await deleteUser(args);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        content: [{ type: "text", text: `Error: ${message}` }],
        isError: true,
      };
    }
  }
);

// Register: loginUser
server.tool(
  "loginUser",
  "Logs user into the system",
  loginUserSchema.shape,
  async (args) => {
    try {
      const result = await loginUser(args);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        content: [{ type: "text", text: `Error: ${message}` }],
        isError: true,
      };
    }
  }
);

// Register: logoutUser
server.tool(
  "logoutUser",
  "Logs out current logged in user session",
  logoutUserSchema.shape,
  async (args) => {
    try {
      const result = await logoutUser(args);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        content: [{ type: "text", text: `Error: ${message}` }],
        isError: true,
      };
    }
  }
);

// Register: createUsersWithArrayInput
server.tool(
  "createUsersWithArrayInput",
  "Creates list of users with given input array",
  createUsersWithArrayInputSchema.shape,
  async (args) => {
    try {
      const result = await createUsersWithArrayInput(args);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        content: [{ type: "text", text: `Error: ${message}` }],
        isError: true,
      };
    }
  }
);

// Register: createUser
server.tool(
  "createUser",
  "Create user",
  createUserSchema.shape,
  async (args) => {
    try {
      const result = await createUser(args);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        content: [{ type: "text", text: `Error: ${message}` }],
        isError: true,
      };
    }
  }
);

// Main entry point
async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  // Log to stderr only (stdout is reserved for MCP protocol)
  console.error("MCP Server running on stdio transport");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
