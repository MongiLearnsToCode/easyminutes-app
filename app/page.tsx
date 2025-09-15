import { authService } from '../services/AuthService';
import AppClient from './AppClient';

export default async function Page() {
  const session = await authService.getSession();

  return <AppClient session={session} />;
}
