from django.db import models
from django.contrib.auth.models import (
    AbstractUser,
    BaseUserManager,
)

class Contact(models.Model):
    user_from = models.ForeignKey('account.User',
        related_name='rel_from_set',
        on_delete=models.CASCADE
    )
    user_to = models.ForeignKey('account.User',
        related_name='rel_to_set',
        on_delete=models.CASCADE
    )
    created = models.DateTimeField(
        auto_now_add=True,
        db_index=True
    )

    class Meta:
        ordering = ('-created',)

    def __str__(self):
        return f"{self.user_from} follows {self.user_to}"

class UserManager(BaseUserManager):
    """Define a model manager for User model with no username field."""

    use_in_migrations = True

    def _create_user(self, email, password, **extra_fields):
        if not email:
            raise ValueError('The given email must be set')

        user = self.model(
            email=self.normalize_email(email), 
            **extra_fields
        )
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_user(self, email, password, **extra_fields):
        """Create and save a regular User with the given email and password."""
        
        extra_fields.setdefault('is_staff', False)
        extra_fields.setdefault('is_superuser', False)
        return self._create_user(email, password, **extra_fields)

    def create_superuser(self, email, password, **extra_fields):
        """Create and save a SuperUser with the given email and password."""

        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        if extra_fields.get('is_staff') is not True:
           raise ValueError(
               'Superuser must have is_staff=True.'
           )
        if extra_fields.get('is_superuser') is not True:
            raise ValueError(
               'Superuser must have is_superuser=True.'
           )
        return self._create_user(email, password, **extra_fields)

class User(AbstractUser):
    """Specify user model fields."""

    first_name = models.CharField(max_length=200)
    last_name = models.CharField(max_length=200)
    email = models.EmailField(
        'Email address', 
        max_length=255,
        unique=True
    )
    following = models.ManyToManyField(
        'self',
        through=Contact,
        related_name='followers',
        symmetrical=False
    )

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'first_name', 'last_name']
    
    objects = UserManager()

    def __str__(self):
        return self.username
