from django.shortcuts import render
from .models import Prices, Transaction
from users.models import Cartera
from django.contrib.auth.decorators import login_required
from datetime import datetime, timedelta
import json


# Create your views here.
@login_required
def simulator_view(request, *args, **kargs):
    # Creamos un objeto de la clase price, donde guardamos los precios de las criptos
    prices = Prices()
    try:
        client = Cartera.objects.get(user = request.user)
    except:
        client = Cartera(user = request.user)
        client.save()

    #Grafico simulador de la cartera
    hours = [(datetime.now()-timedelta(hours=i)).strftime("%H:00") for i in list(range(12))[::-1]]
    transactions = Transaction.objects.filter(user = request.user)
    trans_delta = [tuple(map(lambda y: y.price if y.trans_type == "venta" else -y.price, filter(lambda x: x.hour == hour, transactions))) for hour in hours][::-1]
    values = [client.bitcoin*prices.bitcoin+client.binance*prices.binance+client.ethereum*prices.ethereum]*12
    for i in range(1, 12):
        values[i] = values[i-1]+sum(trans_delta[i-1])

    values = values[::-1]
    
    return render(request, 'simulator_html.html', {'prices':prices, 'client':client, 'transactions':transactions, 'week':json.dumps(hours), 'values':values})