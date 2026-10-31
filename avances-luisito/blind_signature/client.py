# client.py
import math
import random
import hashlib
import xmlrpc.client
from Crypto.PublicKey import RSA
from Crypto.Util.number import bytes_to_long

# FUNCIONES CRIPTOGRAFICAS
def full_domain_hash(
        message: bytes, 
        target_bit_len: int
    ) -> int:
    """
    Expande el hash del mensaje (MGF1) 
    para cubrir todo el módulo N
    y prevenir ataques de 
    maleabilidad / falsificación en RSA ciego.
    """
    target_len = (target_bit_len + 7) // 8
    counter = 0
    derived = b""
    while len(derived) < target_len:
        C = counter.to_bytes(4, byteorder="big")
        derived += hashlib.sha256(message + C).digest()
        counter += 1
    return bytes_to_long(derived[:target_len]) % (1 << (target_bit_len - 1))

class PrivateKey:
    def __init__(self, d: int): self.__d = d
    def get_d(self) -> int: return self.__d

class PublicKey:
    def __init__(self, n: int, e: int):
        self.__n = n
        self.__e = e
    def get_n(self) -> int: return self.__n
    def get_e(self) -> int: return self.__e

class President:
    def __init__(
            self, 
            private_key=None, 
            public_key=None
        ):
        self.__private_key = private_key
        self.__public_key = public_key

    def share_public_key(self) -> PublicKey:
        return self.__public_key

    def generate_rsa_keys(
            self, 
            bits: int = 2048
            ) -> None:
        """
        Funcion para generar las llaves RSA 
        del presidente, estas se van a usar 
        para la firma ciega
        """
        key_pair = RSA.generate(bits)
        self.__public_key = PublicKey(
            key_pair.n, 
            key_pair.e
        )
        self.__private_key = PrivateKey(key_pair.d)

    def blind_signature(
            self, 
            h_blinded: int) -> int:
        """
        Firma a ciegas el hash recibido 
        (Firma por fuera del sobre).
        Fórmula: s' = (h')^d mod n
        """
        return pow(
            h_blinded, 
            self.__private_key.get_d(), 
            self.__public_key.get_n()
        )

class Jury:
    def __init__(
            self, 
            public_key: PublicKey):
        self.__public_key = public_key
        self.__r = self.__generate_r(
            public_key.get_n()
        )
        self.__evaluation: bytes = b""
        self.__s: int = 0

    def __generate_r(
            self, 
            n: int
            ) -> int:
        """Genera el factor de cegado 'r' 
        que sea coprimo con 'n'"""
        sys_rand = random.SystemRandom()
        r = sys_rand.randint(2, n - 1)
        while math.gcd(r, n) != 1:
            r = sys_rand.randint(2, n - 1)
        return r

    def save_evaluation(self, 
        stars: int, 
        comment: str
        ) -> None:
        self.__evaluation = f"Stars: {stars}. Comment: {comment}".encode("utf-8")
        return self.__evaluation.decode('utf-8')

    def blind_hash(self) -> int:
        """
        Calcula el hash FDH de la evaluación 
        y lo ciega (lo mete al sobre opaco).
        Fórmula: h' = (h * r^e) mod n
        """
        n = self.__public_key.get_n()
        e = self.__public_key.get_e()
        
        # 1. Hash adaptado a FDH 
        # (El documento original)
        h = full_domain_hash(
            self.__evaluation, 
            n.bit_length()
        )
        
        # 2. h' = (h * r^e) mod n 
        return (h * pow(self.__r, e, n)) % n

    def unblind_signature(self, s_blinded: int) -> int:
        """
        Desciega la firma recibida 
        del presidente (retira el sobre opaco).
        Fórmula: s = s' * r^-1 mod n
        """
        n = self.__public_key.get_n()
        
        # 1. Calculamos el inverso multiplicativo 
        # modular de r
        r_inverse = pow(self.__r, -1, n)
        
        # 2. s = s' * r^-1 mod n
        self.__s = (s_blinded * r_inverse) % n
        return self.__s

    def verify_signature(self) -> bool:
        """
        Verifica que la firma descegada 
        corresponda a la evaluación original.
        Fórmula: s^e mod n == h_expected
        """
        e = self.__public_key.get_e()
        n = self.__public_key.get_n()
        
        h_expected = full_domain_hash(
            self.__evaluation, 
            n.bit_length()
        )
        return pow(self.__s, e, n) == h_expected


# CODIGO INTERFAZ
def menu_presidente(server):
    presidente = President()
    while True:
        print("\n--- MENÚ PRESIDENTE ---")
        print("1. Generar Llaves RSA y Publicar en Servidor")
        print("2. Ver Bandeja y Firmar Hashes Cegados (A ciegas)")
        print("3. Ver Tablero de Evaluaciones Finales")
        print("4. Salir")
        opc = input("Elige: ")

        if opc == "1":
            print("[*] Generando llaves RSA de 2048 bits...")
            presidente.generate_rsa_keys()
            pub = presidente.share_public_key()
            server.registrar_llave_presidente(str(pub.get_n()), str(pub.get_e()))
            print("[+] Llave pública registrada en el servidor.")
        
        elif opc == "2":
            pendientes = server.obtener_hashes_pendientes()
            if not pendientes:
                print("[-] No hay hashes pendientes por firmar.")
                continue
            
            firmas = {}
            for id_juez, h_cegado_str in pendientes.items():
                print(f"[*] Firmando hash cegado de Juez: {id_juez}")
                firma = presidente.blind_signature(int(h_cegado_str))
                firmas[id_juez] = str(firma)
            
            server.enviar_firmas_ciegas(firmas)
            print("[+] ¡Todas las firmas ciegas fueron enviadas!")

        elif opc == "3":
            mostrar_tablero(server)
        elif opc == "4":
            break

def menu_juez(server, id_juez):
    juez = None
    eval_text = ""
    
    while True:
        print(f"\n--- MENÚ JUEZ ({id_juez}) ---")
        print("1. Obtener Llave Pública del Presidente")
        print("2. Redactar Evaluación y Enviar Hash Cegado (Sobre Opaco)")
        print("3. Recibir Firma, Descegar y Publicar")
        print("4. Ver Tablero de Evaluaciones Finales")
        print("5. Salir")
        opc = input("Elige: ")

        if opc == "1":
            llave_dict = server.obtener_llave_presidente()
            if not llave_dict:
                print("[-] El Presidente aún no ha publicado su llave.")
            else:
                pub_key = PublicKey(int(llave_dict["n"]), int(llave_dict["e"]))
                juez = Jury(pub_key)
                print("[+] Llave obtenida. Motor criptográfico iniciado.")

        elif opc == "2":
            if not juez:
                print("[-] Primero obtén la llave del Presidente (Opción 1).")
                continue
            estrellas = int(input("Estrellas (1-5): "))
            comentario = input("Comentario: ")
            eval_text = juez.save_evaluation(estrellas, comentario)
            
            h_cegado = juez.blind_hash()
            print(f"[*] Tu Hash Cegado es: {str(h_cegado)[:30]}...")
            server.enviar_hash_cegado(id_juez, str(h_cegado))
            print("[+] Enviado al servidor en un sobre opaco.")

        elif opc == "3":
            if not juez:
                print("[-] El juez no está inicializado.")
                continue
            firma_ciega_str = server.obtener_firma_ciega(id_juez)
            if not firma_ciega_str:
                print("[-] El Presidente aún no ha firmado tu evaluación.")
                continue

            print(f"[*] La firma Cegada es: {str(firma_ciega_str)[:30]}...")
            # Descegamos
            firma_final = juez.unblind_signature(int(firma_ciega_str))
            es_valida = juez.verify_signature()
            
            if es_valida:
                print("[+] ¡Firma verificada exitosamente!")
                print(f"[*] La firma final es: {str(firma_final)[:30]}...")
                server.publicar_evaluacion_final(id_juez, eval_text, str(firma_final))
                print("[+] Evaluación publicada en el tablero público.")
            else:
                print("[!] ALERTA: La firma no corresponde a esta evaluación.")

        elif opc == "4":
            mostrar_tablero(server)
        elif opc == "5":
            break

def mostrar_tablero(server):
    finales = server.ver_tablero_publico()
    print("\n========= TABLERO PÚBLICO =========")
    if not finales:
        print("Aún no hay evaluaciones publicadas.")
    for f in finales:
        print(f"\nJUEZ: {f['juez']}")
        print(f"TEXTO: {f['evaluacion']}")
        print(f"FIRMA (Verificada): {f['firma_verificada'][:40]}...")
    print("===================================")

if __name__ == "__main__":
    # Nos conectamos al servidor XML-RPC
    server_proxy = xmlrpc.client.ServerProxy("http://localhost:8000")
    
    print("=== SISTEMA DE EVALUACIÓN CRIPTOGRÁFICA ===")
    rol = input("¿Eres Presidente (p) o Juez (j)?: ").lower()
    
    if rol == 'p':
        menu_presidente(server_proxy)
    elif rol == 'j':
        id_juez = input("Ingresa tu Nombre/ID de Juez (ej. Juez1): ")
        menu_juez(server_proxy, id_juez)
    else:
        print("Rol no reconocido.")