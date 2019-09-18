from django import forms
from .models import Post

class PostForm(forms.ModelForm):
    content = forms.CharField(label='Add some content')

    class Meta:
        model = Post
        fields = ('content',)
