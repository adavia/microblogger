from django.urls import path

from .views import (
    PostDeleteView,
)

urlpatterns = [
    path(
        'post/<int:pk>/delete/', 
        PostDeleteView.as_view(), 
        name='post_delete'
    ),
]
