from django.http import JsonResponse
from django.shortcuts import render
from django.views.generic.base import View
from django.views.generic import DeleteView
from django.contrib.auth.mixins import (
    LoginRequiredMixin,
    UserPassesTestMixin
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
            
            images = []

            for img in post.post_images.all():
                images.append({
                    'thumb': img.thumbnail.url,
                    'original': img.image.url
                })

            return render(request, 'blog/_post.html', {
                'post': post
            })

        return JsonResponse({
            'errors': form.errors
        }, status=400)

    def get(self, request, *args, **kwargs):
        posts = Post.objects.all().order_by('-date_posted')
        form = self.form_class()
        return render(request, self.template_name, {
            'posts': posts,
            'form': form, 
        })

class PostDeleteView(
    LoginRequiredMixin, 
    UserPassesTestMixin, 
    DeleteView):
    model = Post

    def delete(self, request, *args, **kwargs):
        self.get_object().delete()
        return JsonResponse({
            'deleted': True
        })

    def test_func(self):
        post = self.get_object()
        if self.request.user == post.author:
            return True
        return False
