import django_filters
from .models import Product

class ProductFilter(django_filters.FilterSet):
    min_price = django_filters.NumberFilter(field_name="price", lookup_expr='gte')
    max_price = django_filters.NumberFilter(field_name="price", lookup_expr='lte')
    min_rating = django_filters.NumberFilter(field_name="rating", lookup_expr='gte')
    min_reviews = django_filters.NumberFilter(field_name="reviews_count", lookup_expr='gte')
    query = django_filters.CharFilter(field_name="query")

    class Meta:
        model = Product
        fields = []