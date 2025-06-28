import { useState, useEffect } from 'react';
import axios from 'axios';
import { Bar, Scatter } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import './App.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const API_URL = 'http://127.0.0.1:8000/api';

const App = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  // Получаем CSRF токен при загрузке
  useEffect(() => {
    const fetchCsrfToken = async () => {
      try {
        await axios.get(`${API_URL}/csrf/`, {
          withCredentials: true
        });
      } catch (err) {
        console.error('Ошибка получения CSRF токена:', err);
      }
    };
    fetchCsrfToken();
  }, []);

  const getCsrfToken = () => {
    return document.cookie
      .split('; ')
      .find(row => row.startsWith('csrftoken='))
      ?.split('=')[1] || '';
  };

  const parseWildberries = async (query) => {
    if (!query.trim()) {
      setError('Введите поисковый запрос');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Проверяем доступность API
      await axios.get(`${API_URL}/health/`);

      // 2. Отправляем запрос на парсинг
      const response = await axios.post(
        `${API_URL}/products/search/`,
        { query },
        {
          withCredentials: true,
          headers: {
            'X-CSRFToken': getCsrfToken(),
            'Content-Type': 'application/json'
          }
        }
      );

      // 3. Обновляем список товаров
      if (response.data && Array.isArray(response.data)) {
        setProducts(response.data);
      } else {
        throw new Error('Некорректный формат данных от сервера');
      }
    } catch (err) {
      let errorMessage = 'Ошибка сервера';
      if (err.response) {
        if (err.response.status === 403) {
          errorMessage = 'Ошибка доступа (CSRF токен недействителен)';
        } else if (err.response.data && err.response.data.error) {
          errorMessage = err.response.data.error;
        }
      } else if (err.request) {
        errorMessage = 'Сервер не отвечает';
      }
      setError(errorMessage);
      console.error('Детали ошибки:', err);
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
            placeholder="Введите поисковый запрос (например, 'смартфон')"
            onKeyPress={(e) => e.key === 'Enter' && parseWildberries(searchQuery)}
          />
          <button
            onClick={() => parseWildberries(searchQuery)}
            disabled={!searchQuery || loading}
          >
            {loading ? 'Загрузка...' : 'Загрузить товары'}
          </button>
        </div>

        {error && (
          <div className="error">
            {error}
            <button onClick={() => setError(null)} className="close-error">
              ×
            </button>
          </div>
        )}

        {loading && <div className="loading">Загрузка данных с Wildberries...</div>}

        {products.length > 0 ? (
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
                      <tr key={product.wb_id}>
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
        ) : (
          !loading && <div className="no-products">Введите запрос и нажмите "Загрузить товары"</div>
        )}
      </main>

      <footer className="footer">
        <p>Wildberries Parser © {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
};

export default App;