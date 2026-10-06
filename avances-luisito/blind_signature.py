"""
Codigo para probar el blind signature con RSA
Nota: Investigando al parecer el RSA esta medio mierda, entonces se podria usar en su lugar:
- RSA-FDH
- ECDSA

"""

import math
import random
import hashlib
from Crypto.PublicKey import RSA
from Crypto.Util.number import bytes_to_long


def full_domain_hash(message: bytes, target_bit_len: int) -> int:
    """
    Expande el hash del mensaje (MGF1) para cubrir todo el módulo N
    y prevenir ataques de maleabilidad / falsificación en RSA ciego.
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
    def __init__(self, d: int):
        self.__d = d

    def __str__(self):
        return f"({self.__d})"

    def get_d(self) -> int:
        return self.__d


class PublicKey:
    def __init__(self, n: int, e: int):
        self.__n = n
        self.__e = e

    def __str__(self):
        return f"({self.__n},{self.__e})"

    def get_n(self) -> int:
        return self.__n

    def get_e(self) -> int:
        return self.__e


class President:
    def __init__(self, private_key: PrivateKey = None, public_key: PublicKey = None):
        self.__private_key = private_key
        self.__public_key = public_key

    def share_public_key(self) -> PublicKey:
        return self.__public_key

    def get_private_key(self) -> PrivateKey:
        return self.__private_key

    def generate_rsa_keys(self, bits: int = 2048) -> None:
        key_pair: RSA.RsaKey = RSA.generate(bits)
        self.__public_key = PublicKey(key_pair.n, key_pair.e)
        self.__private_key = PrivateKey(key_pair.d)

    def blind_signature(self, h_blinded: int) -> int:
        """s' = (h')^d mod n"""
        return pow(
            h_blinded,
            self.__private_key.get_d(),
            self.__public_key.get_n()
        )


class Jury:
    def __init__(self, public_key: PublicKey):
        self.__public_key = public_key
        self.__r = self.__generate_r(public_key.get_n())
        self.__evaluation: bytes = b""
        self.__h: int = 0
        self.__h_blinded: int = 0
        self.__s: int = 0

    def __generate_r(self, n: int) -> int:
        sys_rand = random.SystemRandom()
        r = sys_rand.randint(2, n - 1)
        while math.gcd(r, n) != 1:
            r = sys_rand.randint(2, n - 1)
        return r

    def save_evaluation(self, stars: int, comment: str) -> None:
        self.__evaluation = f"Stars: {stars}. Comment: {comment}".encode("utf-8")

    def blind_hash(self) -> int:
        """Calcula el hash FDH de la evaluación y lo ciega: h' = (h * r^e) mod n"""
        n = self.__public_key.get_n()
        e = self.__public_key.get_e()

        # Hash adaptado a FDH
        self.__h = full_domain_hash(self.__evaluation, n.bit_length())

        # h' = (h * r^e) mod n
        self.__h_blinded = (self.__h * pow(self.__r, e, n)) % n
        return self.__h_blinded

    def unblind_signature(self, s_blinded: int) -> int:
        """Desciega la firma: s = s' * r^-1 mod n"""
        n = self.__public_key.get_n()
        r_inverse = pow(self.__r, -1, n)

        self.__s = (s_blinded * r_inverse) % n
        return self.__s

    def verify_signature(self, alt_public_key: PublicKey = None) -> bool:
        """Verifica que s^e mod n == h_expected"""
        pk = alt_public_key if alt_public_key else self.__public_key
        e = pk.get_e()
        n = pk.get_n()

        h_expected = full_domain_hash(self.__evaluation, n.bit_length())
        return pow(self.__s, e, n) == h_expected

    def get_evaluation(self) -> bytes:
        return self.__evaluation

    def get_s(self) -> int:
        return self.__s


# =====================================================================
# SIMULACIÓN Y CASOS DE PRUEBA
# =====================================================================
if __name__ == "__main__":
    print("=== 1. FLUJO HAPPY PATH (RUTA NORMAL) ===")
    presidente = President()
    presidente.generate_rsa_keys(2048)
    pub_key = presidente.share_public_key()

    # Creación de jueces
    juez1 = Jury(pub_key)
    juez2 = Jury(pub_key)

    juez1.save_evaluation(4, "Buena pintura")
    juez2.save_evaluation(2, "Mejor dedicate a limpiar mesas")

    # Cegado
    h_blind1 = juez1.blind_hash()
    h_blind2 = juez2.blind_hash()

    # Firma del Presidente
    s_blind1 = presidente.blind_signature(h_blind1)
    s_blind2 = presidente.blind_signature(h_blind2)

    # Descegado (Corregido: cada juez desciega con su propia instancia)
    s1 = juez1.unblind_signature(s_blind1)
    s2 = juez2.unblind_signature(s_blind2)

    # Verificaciones
    v1 = juez1.verify_signature()
    v2 = juez2.verify_signature()

    print(f"[-] Juez 1 firma válida: {v1} (Esperado: True)")
    print(f"[-] Juez 2 firma válida: {v2} (Esperado: True)")

    print("\n=== 2. PRUEBA DE SEGURIDAD: ALTERACIÓN DE EVALUACIÓN ===")
    # El Juez 1 recibe la firma para 4 estrellas, pero intenta publicar 5 estrellas con la misma firma.
    juez1.save_evaluation(5, "Buena pintura")  # Intento de fraude
    v_tampered = juez1.verify_signature()
    print(f"[-] ¿Firma válida tras modificar la evaluación?: {v_tampered} (Esperado: False)")

    print("\n=== 3. PRUEBA DE SEGURIDAD: LLAVE PÚBLICA DE OTRO PRESIDENTE ===")
    # Un impostor (Presidente 2) intenta hacer pasar la firma como suya o validar la del Presidente 1
    impostor = President()
    impostor.generate_rsa_keys(2048)
    pub_key_impostor = impostor.share_public_key()

    # Restauramos la evaluación original
    juez1.save_evaluation(4, "Buena pintura")
    v_wrong_key = juez1.verify_signature(alt_public_key=pub_key_impostor)
    print(f"[-] ¿Firma válida usando la llave pública de otro presidente?: {v_wrong_key} (Esperado: False)")

    print("\n=== 4. PRUEBA DE SEGURIDAD: INTERCAMBIO DE FIRMAS CEGADAS ===")
    # El Juez 2 intenta descegar la firma enviada para el Juez 1 usando su propio factor r
    s_cross_unblind = juez2.unblind_signature(s_blind1)
    v_cross = juez2.verify_signature()
    print(f"[-] ¿Es válida la firma si el Juez 2 desciega la respuesta del Juez 1?: {v_cross} (Esperado: False)")

    print("\n=== 5. PRUEBA DE SEGURIDAD: EVALUACIONES IDÉNTICAS, FACTORES R DISTINTOS ===")
    # Dos jueces redactan EXACTAMENTE el mismo texto. ¿Tienen el mismo hash cegado?
    juez_a = Jury(pub_key)
    juez_b = Jury(pub_key)
    juez_a.save_evaluation(5, "Excelente")
    juez_b.save_evaluation(5, "Excelente")

    h_blind_a = juez_a.blind_hash()
    h_blind_b = juez_b.blind_hash()

    are_blind_hashes_different = h_blind_a != h_blind_b
    print(f"[-] ¿Dos votos idénticos producen hashes cegados distintos gracias al factor r?: {are_blind_hashes_different} (Esperado: True)")

    print("\n=== TODAS LAS PRUEBAS FINALIZADAS ===")