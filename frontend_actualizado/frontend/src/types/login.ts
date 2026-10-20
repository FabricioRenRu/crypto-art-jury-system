/**
 * types/login.ts
 */

export interface LoginRequest {
    email: string;
    contrasena: string;
}

export interface TokenResponse {
    access_token: string;
    token_type: string;
}