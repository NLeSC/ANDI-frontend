"""ANDI URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/1.9/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  url(r'^$', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  url(r'^$', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.conf.urls import url, include
    2. Add a URL to urlpatterns:  url(r'^blog/', include('blog.urls'))
"""
from django.conf.urls import url, include
from django.contrib import admin
from django.conf import settings
from django.conf.urls.static import static

import userena.views
from userena.forms import SignupFormTos

from accounts import views
from accounts.forms import MailDomainValidationForm

from ocpu.views import compute

from svg2pdf.views import svg2pdf

urlpatterns = [
    url(r'^$', views.index, name='index'),
    url(r'^admin/', admin.site.urls),
    url(r'^compute/', compute),
    url(r'^svg2pdf/', svg2pdf),
    url(r'^accounts/signup/$', userena.views.signup,
        {'signup_form': MailDomainValidationForm}),
    url(r'^accounts/activate/(?P<activation_key>\w+)/$',
        userena.views.activate, {'success_url': '/'}),
    url(r'^accounts/', include('userena.urls')),
]
