import React, { useState } from 'react';
import axios from 'axios';

function SearchComponent() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    try {
      const response = await axios.post('/api/products/search/', { query });
      setResults(response.data);
    } catch (error) {
      console.error('Search error:', error);
      alert('Ошибка при поиске товаров');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Поиск на Wildberries..."
      />
      <button onClick={handleSearch} disabled={loading}>
        {loading ? 'Идет поиск...' : 'Найти и сохранить'}
      </button>

      <div className="results">
        {results.map(product => (
          <div key={product.id} className="product-card">
            <h3>{product.name}</h3>
            <p>Цена: {product.price} ₽</p>
            {product.discounted_price && (
              <p>Со скидкой: {product.discounted_price} ₽</p>
            )}
            <p>Рейтинг: {product.rating || 'нет данных'}</p>
            <p>Отзывов: {product.reviews_count}</p>
            <a href={product.url} target="_blank" rel="noopener noreferrer">
              Открыть на Wildberries
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SearchComponent;