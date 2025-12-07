/**
 * Zod schemas for tool input validation
 * Generated from OpenAPI specification
 * 
 * Uses Zod for runtime validation as per MCP SDK best practices
 */

import { z } from 'zod';

export const uploadFileSchema = z.object({
  petId: z.string().describe("ID of pet to update")
});

export const addPetSchema = z.object({
  body: z.object({
  id: z.number().int().optional(),
  category: z.object({
  id: z.number().int().optional(),
  name: z.string().optional()
}).optional(),
  name: z.string(),
  photoUrls: z.array(z.string()),
  tags: z.array(z.object({
  id: z.number().int().optional(),
  name: z.string().optional()
})).optional(),
  status: z.enum(["available", "pending", "sold"]).optional().describe("pet status in the store")
}).describe("Pet object that needs to be added to the store")
});

export const updatePetSchema = z.object({
  body: z.object({
  id: z.number().int().optional(),
  category: z.object({
  id: z.number().int().optional(),
  name: z.string().optional()
}).optional(),
  name: z.string(),
  photoUrls: z.array(z.string()),
  tags: z.array(z.object({
  id: z.number().int().optional(),
  name: z.string().optional()
})).optional(),
  status: z.enum(["available", "pending", "sold"]).optional().describe("pet status in the store")
}).describe("Pet object that needs to be added to the store")
});

export const findPetsByStatusSchema = z.object({
  status: z.string().describe("Status values that need to be considered for filter")
});

export const findPetsByTagsSchema = z.object({
  tags: z.string().describe("Tags to filter by")
});

export const getPetByIdSchema = z.object({
  petId: z.string().describe("ID of pet to return")
});

export const updatePetWithFormSchema = z.object({
  petId: z.string().describe("ID of pet that needs to be updated")
});

export const deletePetSchema = z.object({
  petId: z.string().describe("Pet id to delete")
});

export const getInventorySchema = z.object({

});

export const placeOrderSchema = z.object({
  body: z.object({
  id: z.number().int().optional(),
  petId: z.number().int().optional(),
  quantity: z.number().int().optional(),
  shipDate: z.string().optional(),
  status: z.enum(["placed", "approved", "delivered"]).optional().describe("Order Status"),
  complete: z.boolean().optional()
}).describe("order placed for purchasing the pet")
});

export const getOrderByIdSchema = z.object({
  orderId: z.string().describe("ID of pet that needs to be fetched")
});

export const deleteOrderSchema = z.object({
  orderId: z.string().describe("ID of the order that needs to be deleted")
});

export const createUsersWithListInputSchema = z.object({
  body: z.array(z.object({
  id: z.number().int().optional(),
  username: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().optional(),
  password: z.string().optional(),
  phone: z.string().optional(),
  userStatus: z.number().int().optional().describe("User Status")
})).describe("List of user object")
});

export const getUserByNameSchema = z.object({
  username: z.string().describe("The name that needs to be fetched. Use user1 for testing. ")
});

export const updateUserSchema = z.object({
  username: z.string().describe("name that need to be updated"),
  body: z.object({
  id: z.number().int().optional(),
  username: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().optional(),
  password: z.string().optional(),
  phone: z.string().optional(),
  userStatus: z.number().int().optional().describe("User Status")
}).describe("Updated user object")
});

export const deleteUserSchema = z.object({
  username: z.string().describe("The name that needs to be deleted")
});

export const loginUserSchema = z.object({
  username: z.string().describe("The user name for login"),
  password: z.string().describe("The password for login in clear text")
});

export const logoutUserSchema = z.object({

});

export const createUsersWithArrayInputSchema = z.object({
  body: z.array(z.object({
  id: z.number().int().optional(),
  username: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().optional(),
  password: z.string().optional(),
  phone: z.string().optional(),
  userStatus: z.number().int().optional().describe("User Status")
})).describe("List of user object")
});

export const createUserSchema = z.object({
  body: z.object({
  id: z.number().int().optional(),
  username: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().optional(),
  password: z.string().optional(),
  phone: z.string().optional(),
  userStatus: z.number().int().optional().describe("User Status")
}).describe("Created user object")
});
