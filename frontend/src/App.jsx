import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './layout/AppLayout';
import RTMPage from './views/rtm/RTMPage';
import IEC62304Page from './views/iec62304/IEC62304Page';
import ISO14971Page from './views/iso14971/ISO14971Page';
import ResourcesPage from './views/resources/ResourcesPage';
import DataSourcesPage from './views/datasources/DataSourcesPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/rtm" element={<RTMPage />} />
          <Route path="/iec62304" element={<IEC62304Page />} />
          <Route path="/iso14971" element={<ISO14971Page />} />
          <Route path="/resources" element={<ResourcesPage />} />
          <Route path="/data-sources" element={<DataSourcesPage />} />
          <Route path="*" element={<Navigate to="/rtm" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
