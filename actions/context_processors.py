from .models import Action
from .utils import memoize

def feed(request):
    # Display all actions by default
    if request.user.id:
        actions = Action.objects.exclude(user=request.user)
        following_ids = request.user.following.values_list(
            'id',
            flat=True
        )
        if following_ids:
            # If user is following others, retrieve only their actions
            actions = actions.filter(user_id__in=following_ids)
        actions = actions.select_related('user')\
            .prefetch_related('target')[:10]

        return {'actions': memoize(lambda: actions)}
    return {}
