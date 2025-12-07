/**
 * Tool implementations
 * Each function corresponds to an MCP tool
 */

import axios from 'axios';

const BASE_URL = process.env.API_BASE_URL || "https://petstore.swagger.io/v2";

const API_KEY = process.env.API_KEY || "";

function getAuthHeaders(): Record<string, string> {
  return API_KEY ? { Authorization: `Bearer ${API_KEY}` } : {};
}


/**
 * uploads an image
 * POST /pet/{petId}/uploadImage
 */
export async function uploadFile(args: Record<string, unknown>): Promise<unknown> {
  const response = await axios({
    method: "POST",
    url: `${BASE_URL}/pet/${args.petId ?? ''}/uploadImage`,
    
    
    headers: getAuthHeaders(),
  });
  return response.data;
}

/**
 * Add a new pet to the store
 * POST /pet
 */
export async function addPet(args: Record<string, unknown>): Promise<unknown> {
  const response = await axios({
    method: "POST",
    url: `${BASE_URL}/pet`,
    
    data: args.body,
    headers: getAuthHeaders(),
  });
  return response.data;
}

/**
 * Update an existing pet
 * PUT /pet
 */
export async function updatePet(args: Record<string, unknown>): Promise<unknown> {
  const response = await axios({
    method: "PUT",
    url: `${BASE_URL}/pet`,
    
    data: args.body,
    headers: getAuthHeaders(),
  });
  return response.data;
}

/**
 * Finds Pets by status
 * GET /pet/findByStatus
 */
export async function findPetsByStatus(args: Record<string, unknown>): Promise<unknown> {
  const response = await axios({
    method: "GET",
    url: `${BASE_URL}/pet/findByStatus`,
    params: { status: args.status },
    
    headers: getAuthHeaders(),
  });
  return response.data;
}

/**
 * Finds Pets by tags
 * GET /pet/findByTags
 */
export async function findPetsByTags(args: Record<string, unknown>): Promise<unknown> {
  const response = await axios({
    method: "GET",
    url: `${BASE_URL}/pet/findByTags`,
    params: { tags: args.tags },
    
    headers: getAuthHeaders(),
  });
  return response.data;
}

/**
 * Find pet by ID
 * GET /pet/{petId}
 */
export async function getPetById(args: Record<string, unknown>): Promise<unknown> {
  const response = await axios({
    method: "GET",
    url: `${BASE_URL}/pet/${args.petId ?? ''}`,
    
    
    headers: getAuthHeaders(),
  });
  return response.data;
}

/**
 * Updates a pet in the store with form data
 * POST /pet/{petId}
 */
export async function updatePetWithForm(args: Record<string, unknown>): Promise<unknown> {
  const response = await axios({
    method: "POST",
    url: `${BASE_URL}/pet/${args.petId ?? ''}`,
    
    
    headers: getAuthHeaders(),
  });
  return response.data;
}

/**
 * Deletes a pet
 * DELETE /pet/{petId}
 */
export async function deletePet(args: Record<string, unknown>): Promise<unknown> {
  const response = await axios({
    method: "DELETE",
    url: `${BASE_URL}/pet/${args.petId ?? ''}`,
    
    
    headers: getAuthHeaders(),
  });
  return response.data;
}

/**
 * Returns pet inventories by status
 * GET /store/inventory
 */
export async function getInventory(args: Record<string, unknown>): Promise<unknown> {
  const response = await axios({
    method: "GET",
    url: `${BASE_URL}/store/inventory`,
    
    
    headers: getAuthHeaders(),
  });
  return response.data;
}

/**
 * Place an order for a pet
 * POST /store/order
 */
export async function placeOrder(args: Record<string, unknown>): Promise<unknown> {
  const response = await axios({
    method: "POST",
    url: `${BASE_URL}/store/order`,
    
    data: args.body,
    headers: getAuthHeaders(),
  });
  return response.data;
}

/**
 * Find purchase order by ID
 * GET /store/order/{orderId}
 */
export async function getOrderById(args: Record<string, unknown>): Promise<unknown> {
  const response = await axios({
    method: "GET",
    url: `${BASE_URL}/store/order/${args.orderId ?? ''}`,
    
    
    headers: getAuthHeaders(),
  });
  return response.data;
}

/**
 * Delete purchase order by ID
 * DELETE /store/order/{orderId}
 */
export async function deleteOrder(args: Record<string, unknown>): Promise<unknown> {
  const response = await axios({
    method: "DELETE",
    url: `${BASE_URL}/store/order/${args.orderId ?? ''}`,
    
    
    headers: getAuthHeaders(),
  });
  return response.data;
}

/**
 * Creates list of users with given input array
 * POST /user/createWithList
 */
export async function createUsersWithListInput(args: Record<string, unknown>): Promise<unknown> {
  const response = await axios({
    method: "POST",
    url: `${BASE_URL}/user/createWithList`,
    
    data: args.body,
    headers: getAuthHeaders(),
  });
  return response.data;
}

/**
 * Get user by user name
 * GET /user/{username}
 */
export async function getUserByName(args: Record<string, unknown>): Promise<unknown> {
  const response = await axios({
    method: "GET",
    url: `${BASE_URL}/user/${args.username ?? ''}`,
    
    
    headers: getAuthHeaders(),
  });
  return response.data;
}

/**
 * Updated user
 * PUT /user/{username}
 */
export async function updateUser(args: Record<string, unknown>): Promise<unknown> {
  const response = await axios({
    method: "PUT",
    url: `${BASE_URL}/user/${args.username ?? ''}`,
    
    data: args.body,
    headers: getAuthHeaders(),
  });
  return response.data;
}

/**
 * Delete user
 * DELETE /user/{username}
 */
export async function deleteUser(args: Record<string, unknown>): Promise<unknown> {
  const response = await axios({
    method: "DELETE",
    url: `${BASE_URL}/user/${args.username ?? ''}`,
    
    
    headers: getAuthHeaders(),
  });
  return response.data;
}

/**
 * Logs user into the system
 * GET /user/login
 */
export async function loginUser(args: Record<string, unknown>): Promise<unknown> {
  const response = await axios({
    method: "GET",
    url: `${BASE_URL}/user/login`,
    params: { username: args.username, password: args.password },
    
    headers: getAuthHeaders(),
  });
  return response.data;
}

/**
 * Logs out current logged in user session
 * GET /user/logout
 */
export async function logoutUser(args: Record<string, unknown>): Promise<unknown> {
  const response = await axios({
    method: "GET",
    url: `${BASE_URL}/user/logout`,
    
    
    headers: getAuthHeaders(),
  });
  return response.data;
}

/**
 * Creates list of users with given input array
 * POST /user/createWithArray
 */
export async function createUsersWithArrayInput(args: Record<string, unknown>): Promise<unknown> {
  const response = await axios({
    method: "POST",
    url: `${BASE_URL}/user/createWithArray`,
    
    data: args.body,
    headers: getAuthHeaders(),
  });
  return response.data;
}

/**
 * Create user
 * POST /user
 */
export async function createUser(args: Record<string, unknown>): Promise<unknown> {
  const response = await axios({
    method: "POST",
    url: `${BASE_URL}/user`,
    
    data: args.body,
    headers: getAuthHeaders(),
  });
  return response.data;
}
