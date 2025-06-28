import { useState, useEffect } from 'react';
import axios from 'axios';
import { Bar, Scatter } from 'react-chartjs-2';
import { Chart as ChartJS } from 'chart.js/auto';

const API_URL = 'http://127.0.0.1:8000';

const App = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  // Получаем CSRF токен
  const getCsrfToken = () => {
    return document.cookie
      .split('; ')
      .find(row => row.startsWith('csrftoken='))
      ?.split('=')[1] || '';
  };

  // Загрузка продуктов
  const fetchProducts = async (query = '') => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/products/`, {
        params: { query },
        withCredentials: true
      });
      setProducts(response.data);
    } catch (error) {
      setError('Ошибка загрузки данных');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Парсинг Wildberries
  const parseWildberries = async () => {
    if (!searchQuery.trim()) {
      setError('Введите поисковый запрос');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await axios.post(
        `${API_URL}/products/search/`,
        { query: searchQuery },
        {
          withCredentials: true,
          headers: {
            'X-CSRFToken': getCsrfToken(),
            'Content-Type': 'application/json'
          }
        }
      );

      // После парсинга загружаем обновленные данные
      await fetchProducts(searchQuery);
    } catch (error) {
      setError('Ошибка при парсинге Wildberries');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Сортировка
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedProducts = [...products].sort((a, b) => {
    if (a[sortConfig.key] < b[sortConfig.key]) {
      return sortConfig.direction === 'asc' ? -1 : 1;
    }
    if (a[sortConfig.key] > b[sortConfig.key]) {
      return sortConfig.direction === 'asc' ? 1 : -1;
    }
    return 0;
  });

  // Подготовка данных для графиков
  const getChartData = () => {
    const priceRanges = {
      '0-1000': 0,
      '1001-5000': 0,
      '5001-10000': 0,
      '10001-20000': 0,
      '20001+': 0
    };

    sortedProducts.forEach(product => {
      const price = product.discounted_price || product.price;
      if (price <= 1000) priceRanges['0-1000']++;
      else if (price <= 5000) priceRanges['1001-5000']++;
      else if (price <= 10000) priceRanges['5001-10000']++;
      else if (price <= 20000) priceRanges['10001-20000']++;
      else priceRanges['20001+']++;
    });

    const discountRatingData = sortedProducts
      .filter(p => p.discounted_price && p.rating)
      .map(product => ({
        x: ((product.price - product.discounted_price) / product.price) * 100,
        y: product.rating
      }));

    return { priceRanges, discountRatingData };
  };

  const { priceRanges, discountRatingData } = getChartData();

  return (
    <div className="app">
      <header className="header">
        <h1>Парсер Wildberries</h1>
      </header>

      <main className="main-content">
        <div className="search-section">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Введите поисковый запрос"
          />
          <button
            onClick={parseWildberries}
            disabled={!searchQuery || loading}
          >
            {loading ? 'Загрузка...' : 'Загрузить товары'}
          </button>
        </div>

        {error && <div className="error">{error}</div>}
        {loading && <div className="loading">Загрузка данных...</div>}

        {products.length > 0 && (
          <>
            <div className="products-section">
              <h2>Найдено товаров: {products.length}</h2>
              <div className="table-container">
                <table className="product-table">
                  <thead>
                    <tr>
                      <th onClick={() => handleSort('name')}>
                        Название {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                      </th>
                      <th onClick={() => handleSort('price')}>
                        Цена {sortConfig.key === 'price' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                      </th>
                      <th>Цена со скидкой</th>
                      <th onClick={() => handleSort('rating')}>
                        Рейтинг {sortConfig.key === 'rating' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                      </th>
                      <th onClick={() => handleSort('reviews_count')}>
                        Отзывы {sortConfig.key === 'reviews_count' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedProducts.map(product => (
                      <tr key={product.id}>
                        <td>
                          <a href={product.url} target="_blank" rel="noopener noreferrer">
                            {product.name}
                          </a>
                        </td>
                        <td>{product.price.toLocaleString()} ₽</td>
                        <td>
                          {product.discounted_price
                            ? `${product.discounted_price.toLocaleString()} ₽`
                            : '-'}
                        </td>
                        <td>{product.rating || '-'}</td>
                        <td>{product.reviews_count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="charts-section">
              <h2>Аналитика товаров</h2>
              <div className="charts-grid">
                <div className="chart-container">
                  <Bar
                    data={{
                      labels: Object.keys(priceRanges),
                      datasets: [{
                        label: 'Количество товаров',
                        data: Object.values(priceRanges),
                        backgroundColor: 'rgba(54, 162, 235, 0.7)',
                        borderColor: 'rgba(54, 162, 235, 1)',
                        borderWidth: 1
                      }]
                    }}
                    options={{
                      responsive: true,
                      plugins: {
                        title: {
                          display: true,
                          text: 'Распределение цен'
                        }
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          title: { display: true, text: 'Количество товаров' }
                        },
                        x: {
                          title: { display: true, text: 'Диапазон цен (₽)' }
                        }
                      }
                    }}
                  />
                </div>

                <div className="chart-container">
                  <Scatter
                    data={{
                      datasets: [{
                        label: 'Скидка vs Рейтинг',
                        data: discountRatingData,
                        backgroundColor: 'rgba(255, 99, 132, 0.7)'
                      }]
                    }}
                    options={{
                      responsive: true,
                      plugins: {
                        title: {
                          display: true,
                          text: 'Процент скидки vs Рейтинг товара'
                        }
                      },
                      scales: {
                        x: {
                          title: { display: true, text: 'Процент скидки (%)' }
                        },
                        y: {
                          title: { display: true, text: 'Рейтинг' },
                          min: 0,
                          max: 5
                        }
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      <footer className="footer">
        <p>Wildberries Parser © {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
};

export default App;