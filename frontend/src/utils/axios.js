import axios from 'axios';

const axiosServices = axios.create({
  baseURL: import.meta.env.VITE_APP_API_URL || '',
  timeout: 120000,  // 2 min — large Excel imports can take time
});

export default axiosServices;

export async function fetcher(args) {
  const [url, config] = Array.isArray(args) ? args : [args];
  const res = await axiosServices.get(url, { ...config });
  return res.data;
}
