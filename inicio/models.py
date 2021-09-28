from django.db import models
import tweepy
import sys
from bs4 import BeautifulSoup
import requests

class Noticias:
    __slots__ = ['titular', 'cuerpo', 'link']

    def __init__(self, titular, cuerpo, link) -> None:
        self.titular = titular
        self.cuerpo  = cuerpo
        self.link    = link

    @staticmethod
    def make_list():
        r = requests.get("https://www.bing.com/news/search?q=bitcoin&FORM=HDRSC7")
        soup = BeautifulSoup(r.content, features="lxml")
        try:
            return list(map(lambda x: Noticias(x.find('a', {'class':'title'}).text, x.find('div', {'class':'snippet'})['title'], x.find('a', {'class':'imagelink'})['href']), soup.find_all('div', {'class':'news-card newsitem cardcommon b_cards2'})))
        except:
            return None


# Create your models here.
class Tweets:
    __slots__ = ['tweets_text', 'tweets_images', 'tweets_names', 'tweet_url']
    def __init__(self):
        consumer_key="WoOJNOe0xwHHhRLLDRwF6AI9G"
        consumer_secret="S02f8tSakwlRFJ1lhmAyApwvjOw05rktjiKQDR8dYIFCiQ3hJO"
        auth = tweepy.AppAuthHandler(consumer_key, consumer_secret)

        api = tweepy.API(auth)
                
        non_bmp_map = dict.fromkeys(range(0x10000, sys.maxunicode + 1), 0xfffd)        

        count = 8
        self.tweets_text = list()
        self.tweets_images = list()
        self.tweets_names = list()
        self.tweet_url = list()
        for tweet in tweepy.Cursor(api.search, q="Bitcoin", lang="es").items():
            if tweet.user.followers_count > 1000:
                self.tweets_text.append(tweet.text.translate(non_bmp_map))
                self.tweets_images.append(tweet.user.profile_image_url)
                self.tweets_names.append(tweet.user.screen_name.translate(non_bmp_map))
                self.tweet_url.append(f"https://twitter.com/{tweet.user.screen_name}/status/{tweet.id}")
                count -= 1
            if count == 0:
                break
