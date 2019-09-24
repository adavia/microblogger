from io import BytesIO
import logging
from PIL import Image
from django.core.files.base import ContentFile
from django.db.models.signals import pre_save, m2m_changed
from django.dispatch import receiver
from .models import Post, PostImage

THUMBNAIL_SIZE = (400, 400)
logger = logging.getLogger(__name__)

@receiver(pre_save, sender=PostImage)
def generate_thumbnail(sender, instance, **kwargs):
    logger.info(
        'Generating new thumbnail for post %d',
        instance.post.id,
    )
    image = Image.open(instance.image)
    image = image.convert('RGB')
    image.thumbnail(THUMBNAIL_SIZE, Image.ANTIALIAS)
    temp_thumb = BytesIO()
    image.save(temp_thumb, 'JPEG')
    temp_thumb.seek(0)
    # set save=False, otherwise it will run in an infinite loop
    instance.thumbnail.save(
        instance.image.name,
        ContentFile(temp_thumb.read()),
        save=False,
    )
    temp_thumb.close()

@receiver(m2m_changed, sender=Post.users_like.through)
def users_like_changed(sender, instance, **kwargs):
    instance.total_likes = instance.users_like.count()
    instance.save()
