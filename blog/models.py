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
 
    class Meta: 
        ordering = ('created',) 

class PostImage(models.Model):
    post = models.ForeignKey(
        Post,
        related_name='post_images',
        on_delete=models.CASCADE
    )
    image = models.ImageField(upload_to="posts")
    thumbnail = models.ImageField(upload_to='posts/thumbs', editable=False, null=True)
