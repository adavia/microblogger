from django.urls import path
from django.contrib.auth import views as auth_views
from . import views, forms

urlpatterns = [
    # post views
    path(
        'signup/', 
        views.SignupView.as_view(), 
        name='signup'
    ),
    path(
        'login/',
        auth_views.LoginView.as_view(
            template_name='account/login.html',
            form_class=forms.AuthenticationForm,
        ),
        name='login',
    ),
    path(
        'logout/', 
        auth_views.LogoutView.as_view(
            template_name='account/logout.html',
        ), 
        name='logout'
    )
]
