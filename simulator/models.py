from django.contrib.auth.models import User
from django.db.models.fields import CharField
from web_crypto.settings import BASE_DIR
from django.db import models
import requests

# Create your models here.
#Esta es una clase auxiliar para obtener los precios de las cryptos que nos interesan
class Prices():
    __slots__ = ['bitcoin', 'binance', 'ethereum']
    def __init__(self):
        # Script para coger los valores de las criptos
        # No se almacenan, llaman a las apis y lo muestran en pantalla
        r1 = requests.get('http://api.coincap.io/v2/assets')

        data = r1.json()["data"]
        dollar = 0.82

        for d in data:
            if d["id"] == "binance-coin":
                self.binance = float(d["priceUsd"]) / dollar
            elif d["id"] == "bitcoin":
                self.bitcoin = float(d["priceUsd"]) / dollar
            elif d["id"] == "ethereum":
                self.ethereum = float(d["priceUsd"]) / dollar

# Model para las transacciones
# Crea tablas para poder almacenar valores y mostrarlo en el html
class Transaction(models.Model):
    user       = models.ForeignKey(User, on_delete=models.CASCADE)
    crypto     = models.CharField(max_length=25)
    cantidad   = models.FloatField()
    price      = models.FloatField()
    trans_type = models.CharField(max_length=10)
    hour       = models.CharField(max_length=10, default="")

    class Meta:
        ordering = ['hour']

'''
Importante: Si se cambia un model hay que hacer un 'makemigrations' y un 'migrate'
'''