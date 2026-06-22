import { useEffect, useState } from 'react'
import axios from 'axios'
import './App.css'

const API_URL = 'https://codevector-task-1.onrender.com/api/products'
const PAGE_SIZE = 20

const categories = [
  'All',
  'Electronics',
  'Clothing',
  'Books',
  'Home',
  'Sports',
  'Toys',
  'Food',
  'Beauty',
  'Automotive',
  'Garden',
]

function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value))
}

function formatDate(value) {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function App() {
  const [products, setProducts] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [pageCursor, setPageCursor] = useState(null)
  const [cursorStack, setCursorStack] = useState([])
  const [nextCursor, setNextCursor] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    async function loadProducts() {
      setLoading(true)
      setError('')

      try {
        const params = { limit: PAGE_SIZE }

        if (selectedCategory !== 'All') {
          params.category = selectedCategory
        }

        if (pageCursor) {
          params.cursor = pageCursor
        }

        const response = await axios.get(API_URL, { params })

        if (!active) {
          return
        }

        setProducts(Array.isArray(response.data.products) ? response.data.products : [])
        setNextCursor(response.data.nextCursor ?? null)
      } catch {
        if (!active) {
          return
        }

        setError('Unable to load products right now. Please try again.')
        setProducts([])
        setNextCursor(null)
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    loadProducts()

    return () => {
      active = false
    }
  }, [pageCursor, selectedCategory])

  function handleCategoryChange(event) {
    const nextCategory = event.target.value

    setSelectedCategory(nextCategory)
    setCursorStack([])
    setPageCursor(null)
  }

  function handleNextPage() {
    if (!nextCursor) {
      return
    }

    setCursorStack((stack) => [...stack, pageCursor])
    setPageCursor(nextCursor)
  }

  function handlePreviousPage() {
    if (cursorStack.length === 0) {
      return
    }

    const previousCursor = cursorStack[cursorStack.length - 1]

    setCursorStack((stack) => stack.slice(0, -1))
    setPageCursor(previousCursor)
  }

  const pageNumber = cursorStack.length + 1

  return (
    <main className="page-shell">
      <section className="hero-panel">
        <div className="hero-copy">
          <p className="eyebrow">Product browsing API</p>
          <h1>Browse products with fast cursor pagination.</h1>
          <p className="hero-text">
            Explore the live catalog, filter by category, and move through the
            data with a cursor-backed Next / Previous flow.
          </p>
        </div>

        <div className="toolbar">
          <label className="field">
            <span>Category</span>
            <select value={selectedCategory} onChange={handleCategoryChange}>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>

          <div className="meta-card">
            <span>Page</span>
            <strong>{pageNumber}</strong>
          </div>
        </div>
      </section>

      <section className="table-card">
        <div className="table-topbar">
          <div>
            <h2>Products</h2>
            <p>
              {selectedCategory === 'All'
                ? 'Showing every category.'
                : `Filtered by ${selectedCategory}.`}
            </p>
          </div>

          <div className="pagination-controls">
            <button type="button" onClick={handlePreviousPage} disabled={loading || cursorStack.length === 0}>
              Previous
            </button>
            <button type="button" onClick={handleNextPage} disabled={loading || !nextCursor}>
              Next
            </button>
          </div>
        </div>

        {loading ? (
          <div className="state-card">Loading products...</div>
        ) : error ? (
          <div className="state-card error">{error}</div>
        ) : products.length === 0 ? (
          <div className="state-card">No products found.</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Created At</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id}>
                    <td>
                      <div className="name-cell">
                        <strong>{product.name}</strong>
                        <span className="id-badge">#{product.id.slice(0, 8)}</span>
                      </div>
                    </td>
                    <td>{product.category}</td>
                    <td>{formatCurrency(product.price)}</td>
                    <td>{formatDate(product.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  )
}

export default App
