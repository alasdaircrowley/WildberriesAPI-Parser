from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db import transaction
import requests
from .models import Product
from .serializers import ProductSerializer


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = []  # Отключаем проверку прав доступа

    @action(detail=False, methods=['post'], url_path='search')
    def search_and_save(self, request):
        search_query = request.data.get('query')
        if not search_query:
            return Response({'error': 'Search query is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Парсим данные с Wildberries
            products_data = self.parse_wildberries(search_query)

            # Сохраняем в базу данных
            saved_products = []
            with transaction.atomic():
                for product_data in products_data:
                    product, _ = Product.objects.update_or_create(
                        wb_id=product_data['wb_id'],
                        defaults=product_data
                    )
                    saved_products.append(product)

            # Возвращаем сохраненные товары
            serializer = self.get_serializer(saved_products, many=True)
            return Response(serializer.data)

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def parse_wildberries(self, search_query):
        api_url = "https://search.wb.ru/exactmatch/ru/common/v4/search"
        params = {
            'query': search_query,
            'resultset': 'catalog',
            'limit': 100,
            'dest': -1257786
        }

        response = requests.get(api_url, params=params)
        response.raise_for_status()
        data = response.json()

        return [{
            'wb_id': item['id'],
            'name': item['name'],
            'price': item['priceU'] / 100,
            'discounted_price': item['salePriceU'] / 100 if 'salePriceU' in item else None,
            'rating': item.get('reviewRating'),
            'reviews_count': item.get('feedbacks', 0),
            'query': search_query,
            'url': f"https://www.wildberries.ru/catalog/{item['id']}/detail.aspx"
        } for item in data.get('data', {}).get('products', [])]