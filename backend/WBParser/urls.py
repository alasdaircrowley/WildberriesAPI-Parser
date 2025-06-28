from django.urls import path, include
from django.views.decorators.csrf import ensure_csrf_cookie
from rest_framework.routers import DefaultRouter
from . import views
from django.http import JsonResponse

router = DefaultRouter()
router.register(r'api/products', views.ProductViewSet, basename='product')

@ensure_csrf_cookie
def get_csrf_token(request):
    return JsonResponse({'detail': 'CSRF cookie set'})

def health_check(request):
    return JsonResponse({"status": "ok"})

urlpatterns = [
    path('', include(router.urls)),
    path('api/parse/', views.ProductViewSet.as_view({'post': 'parse_wildberries'}), name='parse-wildberries'),
    path('api/products/search/', views.ProductViewSet.as_view({'post': 'search_and_save'}), name='product-search'),
    path('api/health/', health_check),
    path('api/csrf/', get_csrf_token, name='csrf-token'),
]