import requests
from django.db import transaction
from .models import Product

class WildberriesAPIParser:
    BASE_URL = "https://www.wildberries.ru"
    API_URL = "https://search.wb.ru/exactmatch/ru/common/v4/search"

    @transaction.atomic
    def parse_and_save(self, search_query):
        params = {
            'query': search_query,
            'resultset': 'catalog',
            'limit': 100,
            'sort': 'popular',
            'dest': -1257786,
            'regions': '80,64,38,4,115,83,33,68,70,69,30,86,75,40,1,66,48,110,31,22,71,114'
        }

        response = requests.get(self.API_URL, params=params)
        data = response.json()

        products = []
        for item in data['data']['products']:
            product, created = Product.objects.update_or_create(
                wb_id=item['id'],
                defaults={
                    'name': item['name'],
                    'price': item['priceU'] / 100,
                    'discounted_price': item['salePriceU'] / 100 if 'salePriceU' in item else None,
                    'rating': item.get('reviewRating'),
                    'reviews_count': item.get('feedbacks', 0),
                    'query': search_query,
                    'url': f"{self.BASE_URL}/catalog/{item['id']}/detail.aspx"
                }
            )
            products.append(product)
        return products