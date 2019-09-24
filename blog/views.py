from django.http import JsonResponse, HttpResponse
from django.shortcuts import render
from django.views.generic.base import View
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_POST
from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger
from django.views.generic import DeleteView
from django.contrib.auth.mixins import (
    LoginRequiredMixin,
    UserPassesTestMixin
)
from actions.utils import create_action
from actions.models import Action
from .decorators import ajax_required
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
            # Trigger action
            create_action(request.user, 'created new post')

            return render(request, 'blog/_post.html', {
                'post': post
            })

        return JsonResponse({
            'errors': form.errors
        }, status=400)

    def get(self, request, *args, **kwargs):
        posts = Post.objects.all().order_by('-date_posted')
        # posts_by_popularity = Post.objects.order_by('-total_likes')
        paginator = Paginator(posts, 10)
        page = request.GET.get('page')
        form = self.form_class()

        try:
            posts = paginator.page(page)
        except PageNotAnInteger:
            posts = paginator.page(1)
        except EmptyPage:
            if request.is_ajax():
                # If the request is AJAX and the page is out of range
                # return an empty page
                return HttpResponse('')
            # If page is out of range deliver last page of results
            posts = paginator.page(paginator.num_pages)
        if request.is_ajax():
            return render(request, 'blog/_post_list.html', {
                'posts': posts
            })
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

@ajax_required
@login_required
@require_POST
def post_like(request):
    post_id = request.POST.get('id')
    action = request.POST.get('action')
    if post_id and action:
        try:
            post = Post.objects.get(id=post_id)
            if action == 'like':
                post.users_like.add(request.user)
                create_action(request.user, 'liked', post)
            else:
                post.users_like.remove(request.user)
            return JsonResponse({'status':'ok'})
        except:
            pass
    return JsonResponse({'status':'ko'})
