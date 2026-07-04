import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AdminLayout } from './components/AdminLayout';
import { RotaProtegida } from './components/RotaProtegida';
import { Login } from './pages/Login';
import { PDV } from './pages/PDV';
import { AdminFiado } from './pages/admin/AdminFiado';
import { AdminRankingPagamentos } from './pages/admin/AdminRankingPagamentos';
import { AdminRankingProdutos } from './pages/admin/AdminRankingProdutos';
import { AdminVendas } from './pages/admin/AdminVendas';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <RotaProtegida perfisPermitidos={['VENDEDOR', 'ADMIN']}>
              <PDV />
            </RotaProtegida>
          }
        />
        <Route
          path="/admin"
          element={
            <RotaProtegida perfisPermitidos={['ADMIN']}>
              <AdminLayout />
            </RotaProtegida>
          }
        >
          <Route index element={<AdminVendas />} />
          <Route path="ranking-produtos" element={<AdminRankingProdutos />} />
          <Route path="ranking-pagamentos" element={<AdminRankingPagamentos />} />
          <Route path="fiado" element={<AdminFiado />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
