import { useEffect, useState } from "react";
import { useDebounce } from "react-use";
import { getTrendingMovies, updateSearchCount } from "./appwrite";
import MovieCard from "./components/MovieCard";
import Search from "./components/Search";
import Spinner from "./components/Spinner";

const API_BASE_URL = 'https://api.themoviedb.org/3';
const API_KEY = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJjZDU4MGZjZjRjNDExYzllYjc1ZjQ3MmQ3MjQ4ZmYwYSIsIm5iZiI6MTc1MDA1NDEwOS45MjQsInN1YiI6IjY4NGZiNGRkZDM3NGVlZjM5ZjNmZTk3MSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.S4DK3qE8_GBDCNytHPDCykSJwapyMQRBD3drLYtfMOU'; // Ensure you have set this in your .env file
const API_OPTIONS = {
  method: 'GET',
  headers: {
    accept: 'application/json',
    Authorization: `Bearer ${API_KEY}`
  }
}
// api overload, rate limiting ~ throttling.... (input debouncing)
const App = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [moviesList, setMoviesList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [trendingMovies, setTrendingMovies] = useState([]);

  useDebounce(() => setDebouncedSearchTerm(searchTerm), 500, [searchTerm]);

  const fetchMovies = async (query = "") => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const endpoint = query ?
        `${API_BASE_URL}/search/movie?query=${encodeURIComponent(query)}`
        : `${API_BASE_URL}/discover/movie?sort_by=popularity.desc`;
      const response = await fetch(endpoint, API_OPTIONS);
      if (!response.ok) {
        throw new Error("Failed to get movies");
      }
      const data = await response.json();

      if (data.response === false) {
        setErrorMessage(data.Error || 'Failed to fetch movies');
        setMoviesList([]);
        return;
      }
      setMoviesList(data.results || []);

      if (query && data.results.length > 0) {
        console.log(`Updating search count for query: ${query}`);
        await updateSearchCount(query, data.results[0]);
      }

    } catch (error) {
      console.error(`Error fetching movies ${error}`);
      setErrorMessage('Error fetching movies. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  }


  const loadTrendingMovies = async () => {
    try {
      const movies = await getTrendingMovies();

      setTrendingMovies(movies);
    } catch (error) {
      console.error(`Error fetching trending movies: ${error}`);
      // setErrorMessage('Error fetching trending movies. Please try again later.');s
    }
  }


  useEffect(() => {
    fetchMovies(debouncedSearchTerm);
  }, [debouncedSearchTerm])

  useEffect(() => { loadTrendingMovies() }, [])

  return (
    <main>
      <div className="pattern"></div>
      <div className="wrapper">
        <header>
          <img src="./hero.png" alt="Hero Banner"></img>
          <h1>Find <span className="text-gradient">Movies</span> You'll Enjoy Without the Hassle</h1>
          <Search searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
        </header>

        {trendingMovies.length > 0 && (
          <section className="trending">
            <h2>Trending Movies</h2>
            <ul>
              {trendingMovies.map((movie, index) => (
                <li key={movie.$id}>
                  <p>{index + 1}</p>
                  <img src={movie.poster_url} alt={movie.title}></img>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="all-movies">
          <h2 >All Movies</h2>
          {isLoading ? <Spinner /> : errorMessage ? <p className="text-red">{errorMessage}</p> :
            <ul>
              {
                moviesList.map((movie) => (
                  <MovieCard key={movie.id} movie={movie} />
                ))
              }
            </ul>
          }
        </section>

      </div>
    </main>
  )
}

export default App