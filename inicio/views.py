from django.shortcuts import redirect, render
from simulator.models import Prices
from .models import Noticias, Tweets
from users.models import Cartera

# Create your views here.
def inicio_view(request):
    if request.user.is_authenticated:
        try:
            cartera = Cartera.objects.get(user = request.user)
        except:
            cartera = Cartera(user = request.user)
            cartera.save()
    else:
        cartera = None

    prices = Prices()
    tweets = Tweets()
    return render(request, "index.html", {'cartera':cartera, 'logged':request.user.is_authenticated, 'client':request.user, 'prices':prices, 'tweets':zip(tweets.tweets_images, tweets.tweets_names, tweets.tweets_text, tweets.tweet_url)})

def noticias_view(request):
    noticias = Noticias.make_list()
    if request.user.is_authenticated:
        try:
            cartera = Cartera.objects.get(user = request.user)
        except:
            cartera = Cartera(user = request.user)
            cartera.save()
    else:
        cartera = None

    if not noticias:
        return redirect("/noticias/")
    return render(request, "noticias.html", {'noticias':noticias, 'client':request.user, 'cartera':cartera, 'logged':request.user.is_authenticated})