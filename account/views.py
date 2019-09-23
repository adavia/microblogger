import logging
from django.http import JsonResponse
from django.shortcuts import render
from django.views.decorators.http import require_POST
from django.contrib.auth import login, authenticate
from django.views.generic.edit import FormView
from django.shortcuts import get_object_or_404
from django.contrib.auth.decorators import login_required
from django import forms
from django.contrib import messages
from blog.decorators import ajax_required
from actions.utils import create_action
from .forms import UserCreationForm
from .models import User, Contact

logger = logging.getLogger(__name__)

class SignupView(FormView):
    template_name = 'account/signup.html'
    form_class = UserCreationForm

    def get_success_url(self):
        redirect_to = self.request.GET.get('next', '/')
        return redirect_to
        
    def form_valid(self, form):
        response = super().form_valid(form)
        new_user = form.save()
        # Trigger action
        create_action(new_user, 'has created an account')
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

@login_required
def user_list(request):
    users = User.objects.filter(is_active=True)
    return render(request, 'account/list.html', {
        'users': users
    })

@login_required
def user_detail(request, username):
    user = get_object_or_404(
        User,
        username=username,
        is_active=True
    )
    return render(request, 'account/detail.html', {
        'user': user
    })

@ajax_required
@require_POST
@login_required
def user_follow(request):
    user_id = request.POST.get('id')
    action = request.POST.get('action')
    if user_id and action:
        try:
            user = User.objects.get(id=user_id)
            if action == 'follow':
                Contact.objects.get_or_create(
                    user_from=request.user,
                    user_to=user)
                # Trigger action
                create_action(request.user, 'is following', user)
            else:
                Contact.objects.filter(user_from=request.user,
                    user_to=user).delete()
            return JsonResponse({'status':'ok'})
        except User.DoesNotExist:
            return JsonResponse({'status':'ko'})
    return JsonResponse({'status':'ko'})


