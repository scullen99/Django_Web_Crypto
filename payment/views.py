from users.models import Cartera
from django.shortcuts import render
from simulator.models import Transaction
from datetime import datetime
from django.contrib.auth.decorators import login_required

# Create your views here.
@login_required
def payment_view(request):
    client = Cartera.objects.get(user = request.user)
    # En esta parte usamos la informacion del form del simulador para actualizar los datos
    # Crea el historial de transacciones para el simulador
    if request.method == "POST":
        post = request.POST
        if post.get("cartera_form") != None:
            client.cartera  = post.get("cartera_form")
            client.bitcoin  = post.get("bitcoin_form")
            client.binance  = post.get("binance_form")
            client.ethereum = post.get("ethereum_form")
            client.save()
            if int(post.get("del_form")) == 1:
                Transaction.objects.filter(user = request.user).delete()
            elif int(post.get("del_form")) == 0:
                t = Transaction(user = request.user)
                t.crypto     = post.get("crypto_form")
                t.cantidad   = post.get("cantidad_form")
                t.price      = post.get("price_form")
                t.trans_type = post.get("trans_type_form")
                t.hour       = datetime.now().strftime("%H:00")
                t.save()

    if int(post.get("del_form")) == 0:
        # Coge la transaccion que se va a mostrar en pantalla
        transaction = Transaction.objects.latest("id")
    else:
        transaction = None

    return render(request, 'payment_html.html', {'transaction':transaction, 'reset':(int(post.get("del_form")) == 1), 'sell':(post.get("trans_type_form") == 'sell')})

