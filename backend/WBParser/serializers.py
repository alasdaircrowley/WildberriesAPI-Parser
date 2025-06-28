from rest_framework import serializers
from .models import Product
from .models import WildberriesProduct

class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = '__all__'
        extra_kwargs = {
            'wb_id': {'read_only': True},
            'created_at': {'read_only': True},
            'updated_at': {'read_only': True}
        }

class WildberriesProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = WildberriesProduct
        fields = '__all__'