from django.contrib.auth.forms import AuthenticationForm
from django.shortcuts import render, redirect
from django.contrib import messages
from .forms import UserRegisterForm
from .models import data
import json
from django.contrib.auth.decorators import login_required
from django.contrib.auth import authenticate, logout, login
import datetime
import time


# Create your views here.
def register_view(request):
    if request.method == 'POST':
        form = UserRegisterForm(request.POST)
        if form.is_valid():
            form.save()
            #username=form.cleaned_data.get('username')
            username = form.cleaned_data['username']
            first_name = form.cleaned_data['first_name']
            last_name = form.cleaned_data['last_name']
            password = form.cleaned_data['password1']
            email = form.cleaned_data['email']
            data1 = {
                username: {
                    "email": email,
                    "first_name": first_name,
                    "password": password,
                    "last_name": last_name,
                }
            }

            with open(f'data/{username}.json', 'w') as json_file:
                json.dump({}, json_file)

            def write_json(data, filename=f'data/{username}.json'):
                with open(filename, "w") as f:
                    json.dump(data, f, indent=2)

            with open(f'data/{username}.json') as json_file:
                data = json.load(json_file)
                temp = data
                y = data1
                temp.update(y)
            write_json(data)

            messages.success(request, f'Account created for {username}!')
            return redirect("/accounts/login")
    else:
        form = UserRegisterForm()
    return render(request, 'users/register.html', {'form': form})


def login_view(request):
    if request.method == 'POST':
        form = AuthenticationForm(request, data=request.POST)
        if form.is_valid():
            username = form.cleaned_data.get('username')
            password = form.cleaned_data.get('password')
            user = authenticate(username=username, password=password)
            if user is not None:
                login(request, user)
                return redirect("/")

    form = AuthenticationForm()
    return render(request, 'users/login.html', {'form': form})

@login_required
def logout_view(request):
    logout(request)
    return redirect("/")

@login_required
def main(request):
    return render(request, 'users/Inicio.html')