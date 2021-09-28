from django.db import models
from django.contrib.auth.models import User

class data(models.Model):
   text = models.TextField(max_length=150)
   def __str__(self):
      return self.text

class Cartera(models.Model):
   user = models.OneToOneField(User, primary_key=True, on_delete=models.CASCADE)
   cartera  = models.FloatField(default=1000000)
   bitcoin  = models.FloatField(default=0)
   binance  = models.FloatField(default=0)
   ethereum = models.FloatField(default=0)