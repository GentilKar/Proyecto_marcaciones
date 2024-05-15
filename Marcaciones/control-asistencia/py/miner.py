from hashlib import sha256
from time import time

Nonce_max = 10000000000
texto = "ABCD"


def SHA256(texto):
    return sha256(texto.encode("ascii")).hexdigest()


def mine(numero_bloque, transaccion, hash_anterior, prefijo_de_ceros):

    str_prefijo = "0" * prefijo_de_ceros

    for nonce in range(Nonce_max):

        texto = str(numero_bloque) + transaccion + hash_anterior + str(nonce)
        hash_nuevo = SHA256(texto)

        if hash_nuevo.startswith(str_prefijo):
            print("BTC minado con éxito en el nonce " + str(nonce))
            return nonce, hash_nuevo

    raise BaseException("No se encontró el hash")


if __name__ == "__main__":
    transaccion = input("Ingrese la transacción: ")
    wallet = input("Ingrese su dirección de envío (wallet): ")
    dificultad = 10

    start = time()
    hash_anterior = sha256(texto.encode("ascii")).hexdigest()
    nonce, hash_nuevo = mine(2, transaccion, hash_anterior, dificultad)

    # Valor de 1 BTC en dólares (podrías obtener este valor de una API de precios en tiempo real)
    valor_btc_usd = 60000

    # Calcular el valor en dólares del BTC minado
    btc_minado = 1 / 10**8  # Convertir el nonce a BTC
    valor_en_usd = btc_minado * valor_btc_usd

    print("Nonce encontrado:", nonce)
    print("Hash del bloque:", hash_nuevo)
    print("Valor en BTC minado:", btc_minado, "BTC")
    print("Valor en USD:", valor_en_usd, "USD")
    print("Tiempo de ejecución:", time() - start, "segundos")
