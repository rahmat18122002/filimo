import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Welcome from "./pages/Welcome";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import MovieDetail from "./pages/MovieDetail";
import VipPurchase from "./pages/VipPurchase";
import LiveTV from "./pages/LiveTV";
import AdminLogin from "./pages/AdminLogin";
import AdminGuard from "./components/AdminGuard";
import AdminLayout from "./components/admin/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import MoviesAdmin from "./pages/admin/MoviesAdmin";
import UsersAdmin from "./pages/admin/UsersAdmin";
import VipAdmin from "./pages/admin/VipAdmin";
import CardsAdmin from "./pages/admin/CardsAdmin";
import PaymentsAdmin from "./pages/admin/PaymentsAdmin";
import SliderAdmin from "./pages/admin/SliderAdmin";
import SettingsAdmin from "./pages/admin/SettingsAdmin";
import CategoriesAdmin from "./pages/admin/CategoriesAdmin";


const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Welcome />} />
          <Route path="/home" element={<Index />} />
          <Route path="/movie/:id" element={<MovieDetail />} />
          <Route path="/vip" element={<VipPurchase />} />
          <Route path="/live" element={<LiveTV />} />
          <Route path="/gate" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminGuard><AdminLayout /></AdminGuard>}>
            <Route index element={<Dashboard />} />
            <Route path="movies" element={<MoviesAdmin />} />
            <Route path="categories" element={<CategoriesAdmin />} />
            <Route path="users" element={<UsersAdmin />} />
            <Route path="vip" element={<VipAdmin />} />
            <Route path="cards" element={<CardsAdmin />} />
            <Route path="payments" element={<PaymentsAdmin />} />
            <Route path="slider" element={<SliderAdmin />} />
            <Route path="settings" element={<SettingsAdmin />} />
            
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
