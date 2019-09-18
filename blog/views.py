from django.shortcuts import render, redirect
from django.views.generic.base import View
from django.contrib.auth.mixins import (
    LoginRequiredMixin,
)
from .models import Post, PostImage
from .forms import PostForm

def attached_images(files, post):
    for field in files.getlist('image'):
        img = PostImage(image=field, post=post)
        img.save()

class HomeView( 
    LoginRequiredMixin, 
    View):
    form_class = PostForm
    template_name = 'blog/home.html'

    def post(self, request, *args, **kwargs):
        form = self.form_class(request.POST)
        if form.is_valid():
             # Create Post object but don't save to database yet          
            post = form.save(commit=False)
            # Assign the current user to the post
            post.author = request.user
            # Save the post to the database
            post.save()
            # Associate images to current post
            attached_images(request.FILES, post)
            # Redirect
            return redirect('home')
        return render(request, self.template_name, {
            'form': form
        })

    def get(self, request, *args, **kwargs):
        posts = Post.objects.all()
        form = self.form_class()
        return render(request, self.template_name, {
            'posts': posts,
            'form': form, 
        })
