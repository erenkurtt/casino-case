import AuthGuard from "../src/components/auth/AuthGuard";
import Slot from "../src/components/slotspin/Slot";
import Navigation from "../src/components/navigation/Navigation";

export default function Page() {
  return (
    <>
      <Navigation />

      <AuthGuard>
        <Slot />
      </AuthGuard>
    </>
  );
}