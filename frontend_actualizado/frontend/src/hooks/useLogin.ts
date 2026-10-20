/**
 * hooks/useLogin.ts
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../services/authService";
import { PATHS } from "../routes/paths";

export type RolLogin = 'pintor' | 'jurado';


export const useLogin = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<String | null>(null);
    const navigate = useNavigate();

    const login = async (email: string, contrasena: string, rol: RolLogin) => {
        setIsLoading(true);
        setError(null);

        try{
            const payload = { email, contrasena };
            
            //llamamos al endpoint correcto
            const response = rol === 'pintor'
                ? await authService.loginPintor(payload)
                : await authService.loginJurado(payload);
            
            //Guardamos JWT en el navegador
            sessionStorage.setItem('access_token', response.access_token);
            
            //Devolvemos true para que la UI vaya al paso 2 (pedir el .pem)
            return true;

            
        } catch (err: any) {
            setError(err.message || "Credenciales invalidas.");
            return false;
        } finally {
            setIsLoading(false);
        }
    };
    return { login, isLoading, error };
}