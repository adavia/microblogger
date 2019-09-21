from django.contrib import admin
from .models import Post

@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = ['content', 'author', 'date_posted']
    list_filter = ['created']

# Register your models here.
