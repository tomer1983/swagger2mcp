/**
 * Test UI Server
 * Run this to test your API endpoints via a web interface
 * 
 * Usage: npx ts-node test-ui/server.ts
 * Then open http://localhost:3001 in your browser
 */

import express from 'express';
import cors from 'cors';
import axios from 'axios';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = process.env.TEST_UI_PORT || 3001;
const API_BASE_URL = process.env.API_BASE_URL || "https://petstore.swagger.io/v2";

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

function getAuthHeaders(apiKey?: string): Record<string, string> {
    const headers: Record<string, string> = {};
    if (apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`;
    }
    return headers;
}

app.post('/api/call', async (req, res) => {
    const { tool, arguments: args } = req.body;
    const apiKey = req.headers['x-api-key'] as string;

    try {
        let result: any;
        switch (tool) {
            case "uploadFile": {
                const response = await axios({
                    method: "POST",
                    url: `${API_BASE_URL}/pet/${args?.petId ?? ''}/uploadImage`,
                    
                    
                    headers: getAuthHeaders(apiKey),
                });
                return response.data;
            }
            case "addPet": {
                const response = await axios({
                    method: "POST",
                    url: `${API_BASE_URL}/pet`,
                    
                    data: args?.body,
                    headers: getAuthHeaders(apiKey),
                });
                return response.data;
            }
            case "updatePet": {
                const response = await axios({
                    method: "PUT",
                    url: `${API_BASE_URL}/pet`,
                    
                    data: args?.body,
                    headers: getAuthHeaders(apiKey),
                });
                return response.data;
            }
            case "findPetsByStatus": {
                const response = await axios({
                    method: "GET",
                    url: `${API_BASE_URL}/pet/findByStatus`,
                    params: { status: args?.status },
                    
                    headers: getAuthHeaders(apiKey),
                });
                return response.data;
            }
            case "findPetsByTags": {
                const response = await axios({
                    method: "GET",
                    url: `${API_BASE_URL}/pet/findByTags`,
                    params: { tags: args?.tags },
                    
                    headers: getAuthHeaders(apiKey),
                });
                return response.data;
            }
            case "getPetById": {
                const response = await axios({
                    method: "GET",
                    url: `${API_BASE_URL}/pet/${args?.petId ?? ''}`,
                    
                    
                    headers: getAuthHeaders(apiKey),
                });
                return response.data;
            }
            case "updatePetWithForm": {
                const response = await axios({
                    method: "POST",
                    url: `${API_BASE_URL}/pet/${args?.petId ?? ''}`,
                    
                    
                    headers: getAuthHeaders(apiKey),
                });
                return response.data;
            }
            case "deletePet": {
                const response = await axios({
                    method: "DELETE",
                    url: `${API_BASE_URL}/pet/${args?.petId ?? ''}`,
                    
                    
                    headers: getAuthHeaders(apiKey),
                });
                return response.data;
            }
            case "getInventory": {
                const response = await axios({
                    method: "GET",
                    url: `${API_BASE_URL}/store/inventory`,
                    
                    
                    headers: getAuthHeaders(apiKey),
                });
                return response.data;
            }
            case "placeOrder": {
                const response = await axios({
                    method: "POST",
                    url: `${API_BASE_URL}/store/order`,
                    
                    data: args?.body,
                    headers: getAuthHeaders(apiKey),
                });
                return response.data;
            }
            case "getOrderById": {
                const response = await axios({
                    method: "GET",
                    url: `${API_BASE_URL}/store/order/${args?.orderId ?? ''}`,
                    
                    
                    headers: getAuthHeaders(apiKey),
                });
                return response.data;
            }
            case "deleteOrder": {
                const response = await axios({
                    method: "DELETE",
                    url: `${API_BASE_URL}/store/order/${args?.orderId ?? ''}`,
                    
                    
                    headers: getAuthHeaders(apiKey),
                });
                return response.data;
            }
            case "createUsersWithListInput": {
                const response = await axios({
                    method: "POST",
                    url: `${API_BASE_URL}/user/createWithList`,
                    
                    data: args?.body,
                    headers: getAuthHeaders(apiKey),
                });
                return response.data;
            }
            case "getUserByName": {
                const response = await axios({
                    method: "GET",
                    url: `${API_BASE_URL}/user/${args?.username ?? ''}`,
                    
                    
                    headers: getAuthHeaders(apiKey),
                });
                return response.data;
            }
            case "updateUser": {
                const response = await axios({
                    method: "PUT",
                    url: `${API_BASE_URL}/user/${args?.username ?? ''}`,
                    
                    data: args?.body,
                    headers: getAuthHeaders(apiKey),
                });
                return response.data;
            }
            case "deleteUser": {
                const response = await axios({
                    method: "DELETE",
                    url: `${API_BASE_URL}/user/${args?.username ?? ''}`,
                    
                    
                    headers: getAuthHeaders(apiKey),
                });
                return response.data;
            }
            case "loginUser": {
                const response = await axios({
                    method: "GET",
                    url: `${API_BASE_URL}/user/login`,
                    params: { username: args?.username, password: args?.password },
                    
                    headers: getAuthHeaders(apiKey),
                });
                return response.data;
            }
            case "logoutUser": {
                const response = await axios({
                    method: "GET",
                    url: `${API_BASE_URL}/user/logout`,
                    
                    
                    headers: getAuthHeaders(apiKey),
                });
                return response.data;
            }
            case "createUsersWithArrayInput": {
                const response = await axios({
                    method: "POST",
                    url: `${API_BASE_URL}/user/createWithArray`,
                    
                    data: args?.body,
                    headers: getAuthHeaders(apiKey),
                });
                return response.data;
            }
            case "createUser": {
                const response = await axios({
                    method: "POST",
                    url: `${API_BASE_URL}/user`,
                    
                    data: args?.body,
                    headers: getAuthHeaders(apiKey),
                });
                return response.data;
            }
            default:
                return res.status(400).json({ error: `Unknown tool: ${tool}` });
        }
        res.json(result);
    } catch (error: any) {
        console.error('API call failed:', error.message);
        res.status(error.response?.status || 500).json({
            error: error.message,
            details: error.response?.data
        });
    }
});

app.listen(PORT, () => {
    console.log(`\n🧪 Test UI running at http://localhost:${PORT}`);
    console.log(`📡 Proxying API calls to: ${API_BASE_URL}\n`);
});
