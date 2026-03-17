import axios from 'axios';

const axiosServices = axios.create({
  baseURL: import.meta.env.VITE_APP_API_URL || ''
});

export default axiosServices;

export async function fetcher(args) {
  const [url, config] = Array.isArray(args) ? args : [args];
  const res = await axiosServices.get(url, { ...config });
  return res.data;
}
