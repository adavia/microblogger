import logging
from django import forms
from django.contrib.auth import login, authenticate
from django.views.generic.edit import FormView
from django.contrib import messages
from .forms import UserCreationForm

logger = logging.getLogger(__name__)

class SignupView(FormView):
    template_name = 'account/signup.html'
    form_class = UserCreationForm

    def get_success_url(self):
        redirect_to = self.request.GET.get('next', '/')
        return redirect_to
        
    def form_valid(self, form):
        response = super().form_valid(form)
        form.save()
        email = form.cleaned_data.get('email')
        raw_password = form.cleaned_data.get('password1')
        logger.info(
            'New signup for email=%s through SignupView', email
        )
        user = authenticate(email=email, password=raw_password)
        login(self.request, user)
        messages.info(
            self.request, 'You signed up successfully.'
        )
        return response
