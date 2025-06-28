from django.db import models

class Product(models.Model):
    wb_id = models.BigIntegerField(unique=True)
    name = models.CharField(max_length=255)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    discounted_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    rating = models.FloatField(null=True, blank=True)
    reviews_count = models.IntegerField(default=0)
    query = models.CharField(max_length=255)  # сохраняем поисковый запрос
    url = models.URLField(max_length=500)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'wildberries_products'
        ordering = ['-created_at']# кастомное имя таблицы

    def __str__(self):
        return self.name

from django.db import models
class WildberriesProduct(models.Model):
    search_query = models.CharField(max_length=255)
    products = models.JSONField()
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.search_query} - {self.timestamp}"