import AuthGuard from "../src/components/auth/AuthGuard";
import FavoritesPage from "../src/pages/FavoritesPage";

export default function Page() {
  return (
    <AuthGuard>
      <FavoritesPage />
    </AuthGuard>
  );
}