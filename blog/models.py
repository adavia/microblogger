import uuid
import os
from django.conf import settings
from django.db import models
from django.utils import timezone
from account.models import User

class Post(models.Model):
    content = models.CharField(max_length=250)
    date_posted = models.DateTimeField(default=timezone.now)
    created = models.DateTimeField(auto_now_add=True)
    updated = models.DateTimeField(auto_now=True)
    author = models.ForeignKey(User, on_delete=models.CASCADE)
    active = models.BooleanField(default=True) 
    users_like = models.ManyToManyField(settings.AUTH_USER_MODEL,
        related_name='posts_liked',
        blank=True
    )

def unique_file_name(filename):
    ext = filename.split('.')[-1]
    filename = "%s.%s" % (uuid.uuid4(), ext)
    return filename

def get_file_name(instance, filename):
    return f"post/post_{instance.post.id}_{unique_file_name(filename)}"

def get_thumb_name(instance, filename):
    return f"post/thumbs/post_{instance.post.id}_{unique_file_name(filename)}"

class PostImage(models.Model):
    post = models.ForeignKey(
        Post,
        related_name='post_images',
        on_delete=models.CASCADE
    )
    image = models.ImageField(
        upload_to=get_file_name
    )
    thumbnail = models.ImageField(
        upload_to=get_thumb_name, 
        editable=False, 
        null=True
    )
