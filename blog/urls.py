from django.urls import path

from .views import (
    PostDeleteView,
)

from . import views

urlpatterns = [
    path(
        'post/<int:pk>/delete/', 
        PostDeleteView.as_view(), 
        name='post_delete'
    ),
    path(
        'post/like/', 
        views.post_like, 
        name='post_like'
    )
]
